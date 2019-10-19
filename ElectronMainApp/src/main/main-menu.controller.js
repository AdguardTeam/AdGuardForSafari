const { app, dialog, Menu, BrowserWindow } = require('electron');
const fs = require('fs');
const updater = require('./updater');
const i18n = require('../utils/i18n');
const listeners = require('./notifier');
const events = require('./events');
const log = require('./app/utils/log');
const agApp = require('./app/app');
const applicationApi = require('./api');
const path = require('path');
const AdmZip = require('adm-zip');

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
    const onExportLogsClicked = () => {
        log.info('Exporting log file..');

        const options = {
            defaultPath: app.getPath('documents') + `/adg_safari_logs_${Date.now()}.zip`,
        };

        dialog.showSaveDialog(null, options, (userPath) => {
            if (!userPath) {
                return;
            }

            const logsPath = log.findLogPath();
            if (!logsPath) {
                return;
            }

            log.info(`Log file path: ${logsPath}`);

            const state = [];
            state.push(`Application version: ${agApp.getVersion()}`);
            state.push(`Application locale: ${agApp.getLocale()}`);
            state.push(`Enabled filters: [ ${applicationApi.getEnabledFilterIds().join(',')} ]`);

            const statePath = path.join(path.dirname(logsPath), 'state.txt');
            fs.writeFileSync(statePath, state.join('\r\n'));

            const zip = new AdmZip();
            zip.addLocalFile(logsPath);
            zip.addLocalFile(statePath);
            zip.writeZip(userPath);
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
                        click() { onExportLogsClicked(); }
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



