const appPack = require('./src/utils/app-pack');
const i18n = require('./src/utils/i18n');
const log = require('./src/main/app/utils/log');
const path = require('path');
const os = require('os');
const execSync = require('child_process').execSync;

/* Reconfigure path to config */
process.env["NODE_CONFIG_DIR"] = appPack.resourcePath("/config/");

/* global require, process */

const { app, shell, BrowserWindow } = require('electron');

const uiEventListener = require('./src/main/ui-event-handler');
const startup = require('./src/main/startup');

const trayController = require('./src/main/tray-controller');
const toolbarController = require('./src/main/toolbar-controller');
const mainMenuController = require('./src/main/main-menu.controller');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Check updates
require('./src/main/updater').initUpdater();

// This package opens devtools only in devmode
// No need to delete this line
require('electron-debug')({
    enabled: true,
    showDevTools: false
});


require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

/**
 * Disables hardware acceleration for this app.
 * https://github.com/AdguardTeam/AdGuardForSafari/issues/110
 */
app.disableHardwareAcceleration();

/**
 * Creates browser window with default settings
 */
function createWindow() {
    const browserWindow = new BrowserWindow({
        title: "AdGuard for Safari",
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 768,
        center: true,
        icon: './src/main/ui/images/128x128.png',
        resizable: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    browserWindow.once('ready-to-show', () => {
        browserWindow.show();
    });

    return browserWindow;
}

/**
 * Creates main window
 */
function loadMainWindow(onWindowLoaded) {

    if (!mainWindow) {
        mainWindow = createWindow();
    }

    mainWindow.loadFile('./src/main/ui/options.html');

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
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
        loadMainWindow(onWindowLoaded);
        uiEventListener.register(mainWindow);
    }
}

// We don't have a proper way to detect if app was opened at login,
// so as a workaround for now we will parse login time from shell command
// or we will take system uptime as an indicator.
// Less than a minute from login means the app was launched at login.
// https://github.com/AdguardTeam/AdGuardForSafari/issues/141
// https://github.com/adguardteam/adguardforsafari/issues/118
function isOpenedAtLogin() {
    const SECONDS_FROM_LOGIN = 60;

    try {
        const stdout = execSync('who | grep -i "$USER.*console"', { timeout: 100}).toString();
        //Output format: userName console  Jun 20 18:14
        log.info('Checking open at login user console: {0}', stdout);
        const now = new Date();
        const loginDateTime = Date.parse(`${stdout} ${now.getFullYear()}`);
        log.info('Checking open at login login date: {0}', loginDateTime);
        if (!isNaN(loginDateTime)) {
            log.info('Checking open at login, comparing times');
            return now.getTime() - loginDateTime < 2 * SECONDS_FROM_LOGIN * 1000;
        }
    } catch (e) {
        log.info('Error: {0}', e);
    }

    log.info('Checking open at login, fallback comparing os uptime: {0}', os.uptime());
    return os.uptime() < SECONDS_FROM_LOGIN;
}

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

    log.info('App ready - creating browser windows');

    if (isOpenedAtLogin()) {
        log.info('App is opened at login');

        // Open in background at login
        if (process.platform === 'darwin') {
            app.dock.hide();
        }

        startup.init(showWindow, (shouldShowMainWindow) => {
            uiEventListener.init();

            if (shouldShowMainWindow) {
                loadMainWindow();
            }
        });
    } else {
        log.info('App is opened');

        loadSplashScreenWindow(() => {
            log.info('Splash screen loaded');

            startup.init(showWindow, () => {
                uiEventListener.init();
                loadMainWindow();
                uiEventListener.register(mainWindow);
            });
        });
    }

    mainMenuController.initMenu(showWindow);
    tray = trayController.initTray(showWindow);
    toolbarController.initToolbarController(showWindow);
}));

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    } else {
        app.dock.hide();
    }
});

app.on('browser-window-created', () => {
    if (process.platform === 'darwin') {
        app.dock.show();
    }
});

/**
 * On app activate
 */
app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        loadMainWindow();
        uiEventListener.register(mainWindow);
    }
});