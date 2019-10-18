const { app, Menu, BrowserWindow } = require('electron');
const updater = require('./updater');
const i18n = require('../utils/i18n');
const listeners = require('./notifier');
const events = require('./events');

/**
 * Module Menu
 * Define structure of Main menu which appears in the left top corner
 * 
 * This menu allows users to use hotkeys for commands such as Copy/Paste/Select all and so on
 */
module.exports = (() => {
    /**
     * On about clicked
     */
    const onAboutClicked = (showMainWindow) => {
        showMainWindow(() => {
            listeners.notifyListeners(events.SHOW_OPTIONS_ABOUT_TAB);
        });
    };

    /**
     * On close window
     */
    const onCloseWinClicked = () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.close();
        }
    };

    /**
     * On export logs clicked
     */
    const onExportLogsClicked = (showMainWindow) => {
        console.log('export logs');

        //TODO: Add entitlement

        const { dialog, app } = require('electron');
        //TODO: Change def name
        const options = {
            defaultPath: app.getPath('documents') + '/adg_safari_DDMMYYYYMISS.zip',
        };

        dialog.showSaveDialog(null, options, (userPath) => {
            console.log(userPath);

            const log = require('./app/utils/log');
            const logsPath = log.findLogPath();
            console.log(logsPath);

            if(userPath){
                const fs = require('fs');

                //TODO: Extract state
                //TODO: zip
                fs.copyFile(logsPath, userPath, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("The file has been saved successfully");
                });
            }
        });
    };

    /**
     * Initialization method
     * Should be execute when the app is ready
     *
     * @param showMainWindow
     */
    const initMenu = (showMainWindow) => {
        const template = [
            { 
                label: 'AdGuard for Safari',
                submenu: [
                    {
                        label: i18n.__('main_menu_about.message'),
                        click() { onAboutClicked(showMainWindow); }
                    },
                    { type: 'separator' },
                    {
                        label: i18n.__('main_menu_hide.message'),
                        accelerator: 'cmd+h',
                        click() { app.hide(); }
                    },
                    {
                        label: i18n.__('main_menu_close_window.message'),
                        accelerator: 'cmd+w',
                        click() { onCloseWinClicked(); }
                    },
                    { type: 'separator' },
                    {
                        label: i18n.__('tray_menu_export_logs.message'),
                        click() { onExportLogsClicked(showMainWindow); }
                    },
                    { type: 'separator' },
                    {
                        label: i18n.__('tray_menu_quit.message'),
                        accelerator: 'cmd+q',
                        click() { app.quit(); }
                    }
                ],
            },
            {
                label: i18n.__('main_menu_edit.message'),
                submenu: [
                    { 
                        label: i18n.__('main_menu_undo.message'),
                        accelerator: 'cmd+z',
                        selector: 'undo:' 
                    },
                    { type: 'separator' },
                    {
                        label: i18n.__('main_menu_cut.message'),
                        accelerator: 'cmd+x', 
                        selector: 'cut:' 
                    },
                    { 
                        label: i18n.__('main_menu_copy.message'),
                        accelerator: 'cmd+c',
                        selector: 'copy:' 
                    },
                    {
                        label: i18n.__('main_menu_paste.message'),
                        accelerator: 'cmd+v',
                        selector: 'paste:' 
                    },
                    {
                        label: i18n.__('main_menu_select-all.message'),
                        accelerator: 'cmd+a',
                        selector: 'selectAll:' 
                    }
                ]
            }
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    };

    return { initMenu }
})();



