const appPack = require('../utils/app-pack');
const i18n = require('../utils/i18n');

const filters = require('./app/filters-manager');
const listeners = require('./notifier');
const antibanner = require('./app/antibanner');
const events = require('./events');
const storage = require('./app/storage/storage');

const {app, shell, Tray, Menu} = require('electron');

/**
 * Tray controller.
 * Handles tray events and setups its view state.
 */
module.exports = (() => {

    // const LAUNCH_AT_LOGIN_KEY = 'launch-at-login-set';

    const onCheckFiltersUpdateClicked = () => {
        filters.checkAntiBannerFiltersUpdate(true);
    };

    const onLaunchAdguardAtLoginClicked = (e) => {
        app.setLoginItemSettings({
            openAtLogin: !!e.checked
        });
    };

    const isOpenAtLoginEnabled = () => {
        return app.getLoginItemSettings().openAtLogin;

        // TODO: Fix
        // Due to https://github.com/electron/electron/issues/10880
        // by default 'Launch at login is disabled'

        // if (storage.getItem(LAUNCH_AT_LOGIN_KEY)) {
        //     return app.getLoginItemSettings().openAtLogin;
        // } else {
        //     storage.setItem(LAUNCH_AT_LOGIN_KEY, true);
        //
        //     //Set default true
        //     app.setLoginItemSettings({
        //         openAtLogin: true
        //     });
        //
        //     return true;
        // }
    };

    const imageFolder = appPack.resourcePath('/src/main/icons');
    const trayImageOff = imageFolder + '/ext_pauseTemplate.png';
    const trayImageOn = imageFolder + '/extTemplate.png';

    /**
     * Initializes icon in tray
     */
    const initTrayIcon = (showWindow) => {

        const isLaunchAtLogin = isOpenAtLoginEnabled();

        const tray = new Tray(trayImageOff);
        tray.setPressedImage(trayImageOff);

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

        const setTrayProtectionStatusIcon = () => {
            if (antibanner.isRunning()) {
                tray.setImage(trayImageOn);
                tray.setPressedImage(trayImageOn);
            } else {
                tray.setImage(trayImageOff);
                tray.setPressedImage(trayImageOff);
            }
        };

        listeners.addListener((event) => {
            if (event === events.REQUEST_FILTER_UPDATED) {
                setTrayProtectionStatusIcon();
            }
        });

        setTrayProtectionStatusIcon();

        return tray;
    };

    return {
        initTrayIcon: initTrayIcon
    };

})();