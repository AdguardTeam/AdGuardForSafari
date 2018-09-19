const appPack = require('../utils/app-pack');
const i18n = require('../utils/i18n');

const filters = require('./app/filters-manager');

const {app, shell, Tray, Menu} = require('electron');
const AutoLaunch = require('auto-launch');


/**
 * Tray controller.
 * Handles tray events and setups its view state.
 */
module.exports = (() => {

    const onCheckFiltersUpdateClicked = () => {
        filters.checkAntiBannerFiltersUpdate(true);
    };

    const autoLauncher = new AutoLaunch({
        name: app.getName(),
        mac: {
            useLaunchAgent: true
        }
    });

    let autoLaunchEnabled = false;
    autoLauncher.isEnabled().then(function (isEnabled) {
        autoLaunchEnabled = isEnabled;
    }).catch(function (err) {
        //Ignore
    });

    const onLaunchAdguardAtLoginClicked = (e) => {
        if (e.checked) {
            autoLauncher.enable();
        } else {
            autoLauncher.disable();
        }
    };

    /**
     * Initializes icon in tray
     */
    const initTrayIcon = (showWindow) => {

        const isLaunchAtLogin = autoLaunchEnabled;

        const imageFolder = appPack.resourcePath('/src/main/icons');
        const trayImage = imageFolder + '/app-icon-16.png';
        let tray = new Tray(trayImage);
        tray.setPressedImage(imageFolder + '/app-icon-16.png');

        const contextMenu = Menu.buildFromTemplate([{
            label: i18n.__('tray_menu_about.message'), click: () => {
                shell.openExternal('https://github.com/AdguardTeam/AdGuardForSafari');
            }
        }, {
            label: i18n.__('tray_menu_preferences.message'), click: () => {
                showWindow();
            }
        }, {
            label: i18n.__('tray_menu_check_updates.message'), click: onCheckFiltersUpdateClicked
        }, {
            type: "separator"
        }, {
            label: i18n.__('tray_menu_launch_at_startup.message'), type: "checkbox",
            checked: isLaunchAtLogin, click: onLaunchAdguardAtLoginClicked
        }, {
            type: "separator"
        }, {
            label: i18n.__('tray_menu_quit.message'), click: () => {
                app.quit();
            }
        }
        ]);

        tray.setContextMenu(contextMenu);

        return tray;
    };

    return {
        initTrayIcon: initTrayIcon
    };

})();