/* global require, process */

const {app, shell, BrowserWindow} = require('electron');

const uiEventListener = require('./src/main/ui-event-handler');
const application = require('./src/main/app');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: './src/main/ui/images/128x128.png',
        resizable: true
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

    //Open _target=blank href in external url
    mainWindow.webContents.on('new-window', function(event, url){
        event.preventDefault();
        shell.openExternal(url);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', (() => {
    application.init();

    uiEventListener.init();
    createWindow();
    uiEventListener.register(mainWindow);
}));

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
        uiEventListener.register(mainWindow);
    }
});
