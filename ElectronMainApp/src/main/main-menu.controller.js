const { app, Menu } = require('electron');
const i18n = require('../utils/i18n');

/**
 * Module Menu
 * Define structure of Main menu which appears in the left top corner
 * 
 * This menu allows users to use hotkeys for commands such as Copy/Paste/Select all and so on
 */
module.exports = (() => {
    const template = [
        { 
            label: 'AdGuard',
            submenu: [
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

    /**
     * Initialization method
     * Should be execute when the app is ready
     */
    function initMenu() {
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    return { initMenu }
})();



