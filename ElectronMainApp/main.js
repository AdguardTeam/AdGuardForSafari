const {
    app,
    shell,
    BrowserWindow,
    dialog,
    nativeTheme,
    nativeImage,
} = require('electron');

const appPack = require('./src/utils/app-pack');
const i18n = require('./src/utils/i18n');
const log = require('./src/main/app/utils/log');

/* Reconfigure path to config */
process.env['NODE_CONFIG_DIR'] = appPack.resourcePath('/config/');

/* global require, process */

const uiEventListener = require('./src/main/ui-event-handler');
const startup = require('./src/main/startup');

const trayController = require('./src/main/tray-controller');
const toolbarController = require('./src/main/toolbar-controller');
const mainMenuController = require('./src/main/main-menu.controller');
const settings = require('./src/main/app/settings-manager');
const { getChannel, getConfiguration } = require('./src/main/app/app');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Check updates
require('./src/main/updater').initUpdater();

// This package opens devtools only in devmode
// No need to delete this line
require('electron-debug')({
    enabled: true,
    showDevTools: false,
});

if (settings.isHardwareAccelerationDisabled()) {
    /**
     * Disables hardware acceleration for this app.
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/110
     */
    app.disableHardwareAcceleration();
}

const cssMode = nativeTheme.shouldUseDarkColors ? '#323232' : '#ffffff';

/**
 * Creates browser window with default settings
 */
function createWindow() {
    const browserWindow = new BrowserWindow({
        title: 'AdGuard for Safari',
        width: 960,
        height: 768,
        minWidth: 960,
        minHeight: 768,
        center: true,
        icon: nativeImage.createFromPath('./src/main/ui/images/128x128.png'),
        resizable: true,
        show: false,
        backgroundColor: cssMode,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
    });

    browserWindow.once('ready-to-show', () => {
        browserWindow.show();
    });

    return browserWindow;
}

/**
 * Add a confirmation dialog on window close
 */
function confirmWindowClose() {
    // Check if we have previously saved setting
    const quitOnCloseWindow = settings.isQuitOnCloseWindow();
    if (quitOnCloseWindow === 1) {
        log.info('Saved setting - quit application');

        mainWindow.forceClose = true;
        app.quit();

        return;
    }
    if (quitOnCloseWindow === 0) {
        log.info('Saved setting - close window');

        mainWindow.forceClose = true;
        mainWindow.close();

        return;
    }

    dialog.showMessageBox({
        type: 'question',
        message: i18n.__('window_close_dialog_message.message'),
        detail: i18n.__('window_close_dialog_detail.message'),
        checkboxLabel: i18n.__('window_close_dialog_checkbox.message'),
        buttons: [
            i18n.__('window_close_dialog_no.message'),
            i18n.__('window_close_dialog_yes.message'),
            i18n.__('window_close_dialog_cancel.message'),
        ],
        defaultId: 1,
    }).then((result) => {
        if (result.response === 2) {
            log.info('Confirmation cancelled');
            return;
        }

        const keepAppRunning = result.response === 1;

        if (result.checkboxChecked) {
            settings.changeQuitOnCloseWindow(keepAppRunning ? 0 : 1);
        }

        if (!keepAppRunning) {
            log.info('Force quit application on close window');
            app.exit();
        } else {
            log.info('Close window');
            mainWindow.forceClose = true;
            mainWindow.close();
        }
    });
}

/**
 * Creates main window
 */
function loadMainWindow(onWindowLoaded) {

    if (!mainWindow) {
        mainWindow = createWindow();
    }
    mainWindow.loadFile('./src/main/ui/options.html');

    // reloads page to update color theme if OS color theme has been changed
    nativeTheme.on('updated', function theThemeHasChanged () {
        if (mainWindow) {
            mainWindow.webContents.reload();
        }
    });

    // on close
    mainWindow.on('close', (e) => {
        log.info('On main window close..');

        if (mainWindow && mainWindow.forceClose) {
            delete mainWindow.forceClose;

            log.info('Close confirmation skipped');
            return;
        }

        e.preventDefault();

        confirmWindowClose();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        log.info('On main window closed..');

        app.dock.hide();

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        uiEventListener.unregister(mainWindow);
        mainWindow = null;
    });

    // Open _target=blank hrefs in external window
    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    });

    if (onWindowLoaded) {
        const onDidFinishLoad = () => {
            mainWindow.webContents.removeListener('did-finish-load', onDidFinishLoad);

            if (typeof onWindowLoaded === 'function') {
                onWindowLoaded();
            }
        };

        mainWindow.webContents.addListener('did-finish-load', onDidFinishLoad);
    }
}

/**
 * Loads splash screen while loading
 */
function loadSplashScreenWindow(onWindowLoaded) {
    mainWindow = createWindow();
    mainWindow.loadFile('./src/main/ui/loading.html');

    if (onWindowLoaded) {
        const onDidFinishLoad = () => {
            mainWindow.webContents.removeListener('did-finish-load', onDidFinishLoad);

            if (typeof onWindowLoaded === 'function') {
                mainWindow.webContents.removeListener('did-finish-load', onDidFinishLoad);
                onWindowLoaded();
            }
        };

        mainWindow.webContents.addListener('did-finish-load', onDidFinishLoad);
    }
}

/**
 * Shows main window
 *
 * @param onWindowLoaded callback on window created and loaded
 */
function showWindow(onWindowLoaded) {
    if (mainWindow) {
        mainWindow.show();

        if (typeof onWindowLoaded === 'function') {
            onWindowLoaded();
        }
    } else {
        app.dock.show();

        loadMainWindow(onWindowLoaded);
        uiEventListener.register(mainWindow);
    }
}

/**
 * Should app launch silent in background
 *
 * @return {*}
 */
function shouldOpenSilent() {
    if (isOpenedAtLogin()) {
        log.info('App is opened at login');
        return true;
    }

    return process.env['LAUNCHED_BACKGROUND'];
}

/**
 * Checks if app is launched at login
 *
 * @return {string|undefined}
 */
function isOpenedAtLogin() {
    return process.env['LAUNCHED_AT_LOGIN'];
}

/**
 * Checks if `AdGuard for Safari.app` is running from Applications folder
 * otherwise shows the dialog message and moves `AdGuard for Safari.app` there
 */
const checkIsInApplicationsFolder = () => {
    if (getConfiguration() === 'Debug') {
        return;
    }

    if (!app.isInApplicationsFolder()) {
        log.error('AdGuard for Safari has been run not from Application folder');
        const response = dialog.showMessageBoxSync({
            type: 'question',
            message: i18n.__('folder_check_dialog_message.message'),
            detail: i18n.__('folder_check_dialog_detail.message'),
            buttons: [i18n.__('folder_check_dialog_quit.message'), i18n.__('folder_check_dialog_move.message')],
            defaultId: 1,
        });
        if (response === 1) {
            try {
                const successfullyMoved = app.moveToApplicationsFolder();
                if (successfullyMoved) {
                    log.warn('AdGuard for Safari was successfully moved to Applications folder');
                }
            } catch (error) {
                log.error(`Error moving AdGuard for Safari to Application folder: ${error.message}`);
            }
        } else {
            log.info('Force quit application');
            app.exit();
        }
    }
};

// Keep a global reference of the tray object, if you don't, the tray icon will
// be hidden automatically when the JavaScript object is garbage collected.
let tray;

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', (() => {
    i18n.setAppLocale(app.getLocale());
    if (getChannel() !== 'MAS') {
        checkIsInApplicationsFolder();
    }

    log.info(`Starting AdGuard v${app.getVersion()}`);
    log.info('App ready - creating browser windows');

    if (shouldOpenSilent()) {
        log.info('App is launching in background');

        // Open in background
        app.dock.hide();

        startup.init(showWindow, (shouldShowMainWindow) => {
            log.info('Startup finished.');

            uiEventListener.init();

            if (shouldShowMainWindow) {
                log.info('Loading main window..');

                app.dock.show();

                loadMainWindow();
            }
        });
    } else {
        log.info('App is launching in foreground');

        app.dock.show();

        loadSplashScreenWindow(() => {
            log.debug('Splash screen loaded');

            startup.init(showWindow, () => {
                uiEventListener.init();
                loadMainWindow(() => {
                    toolbarController.requestMASReview();
                });
                uiEventListener.register(mainWindow);
            });
        });
    }

    mainMenuController.initMenu(showWindow);
    tray = trayController.initTray(showWindow);
    toolbarController.initToolbarController(showWindow);

    log.info('App on ready completed');
}));

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', () => {
    log.info('On window all closed');

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    log.info('Hiding dock item');
    app.dock.hide();
});

/**
 * Before app quit
 */
app.on('before-quit', () => {
    log.debug('On app before-quit');

    if (mainWindow) {
        mainWindow.forceClose = true;
    }
});

/**
 * On app activate
 */
app.on('activate', () => {
    log.info('On app activate');
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        loadMainWindow();
        uiEventListener.register(mainWindow);
    }
});

if (getChannel() === 'MAS') {
    process.on('uncaughtException', (error) => {
        log.error(`Uncaught exception: ${error}`);
    });
} else {
    process.on('uncaughtExceptionMonitor', (error) => {
        log.error(`Uncaught exception: ${error}`);
    });
}
