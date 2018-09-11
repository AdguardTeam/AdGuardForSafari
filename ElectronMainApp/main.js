const appPack = require('./src/utils/app-pack');

/* Reconfigure path to config */
process.env["NODE_CONFIG_DIR"] = appPack.resourcePath("/config/");

/* global require, process */

const {app, shell, BrowserWindow, Tray, Menu} = require('electron');

const uiEventListener = require('./src/main/ui-event-handler');
const startup = require('./src/main/startup');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

/**
 * Creates main window
 */
function createWindow() {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        center: true,
        icon: './src/main/ui/images/128x128.png',
        resizable: true,
        webPreferences: {
            zoomFactor: 0.7
        }
    });

    mainWindow.loadFile('./src/main/ui/options.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // Open _target=blank hrefs in external window
    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    });
}

// Keep a global reference of the tray object, if you don't, the tray icon will
// be hidden automatically when the JavaScript object is garbage collected.
let tray;

/**
 * Initializes tray icon
 */
function initTrayIcon() {

    const imageFolder = appPack.resourcePath('/src/main/icons');
    const trayImage = imageFolder + '/app-icon-16.png';
    tray = new Tray(trayImage);
    tray.setPressedImage(imageFolder + '/app-icon-16.png');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Preferences", click: () => {
                if (mainWindow) {
                    mainWindow.show();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: "Quit", click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', (() => {
    startup.init();

    uiEventListener.init();
    createWindow();
    uiEventListener.register(mainWindow);

    initTrayIcon();
}));

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * On app activate
 */
app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
        uiEventListener.register(mainWindow);
    }
});
