const appPack = require('../utils/app-pack');
const i18n = require('../utils/i18n');

const applicationApi = require('./api');
const filters = require('./app/filters-manager');
const listeners = require('./notifier');
const antibanner = require('./app/antibanner');
const events = require('./events');
const storage = require('./app/storage/storage');
const settings = require('./app/settings-manager');

const { app, shell, Tray, Menu } = require('electron');

/**
 * Tray controller.
 * Handles tray events and setups its view state.
 */
module.exports = (() => {

    const imageFolder = appPack.resourcePath('/src/main/icons');
    const trayImageOff = imageFolder + '/ext_pauseTemplate.png';
    const trayImageOn = imageFolder + '/extTemplate.png';

    const onCheckFiltersUpdateClicked = () => {
        filters.checkAntiBannerFiltersUpdate(true);
    };

    const onLaunchAdguardAtLoginClicked = (e) => {
        tray.skipRerender = true;
        settings.changeLaunchAtLogin(!!e.checked);
    };

    const isOpenAtLoginEnabled = () => {
        return settings.isLaunchAtLoginEnabled();
    };

    const onProtectionToggleClicked = (e) => {
        const running = antibanner.isRunning();

        if (!!e.checked) {
            if (!running) {
                applicationApi.start();
            }
        } else {
            if (running) {
                applicationApi.pause();
            }
        }
    };

    /**
     * Sets tray icon according to protection status
     */
    const setTrayProtectionStatusIcon = (trayIcon, isRunning) => {
        if (trayIcon) {
            if (isRunning) {
                trayIcon.setImage(trayImageOn);
                trayIcon.setPressedImage(trayImageOn);
            } else {
                trayIcon.setImage(trayImageOff);
                trayIcon.setPressedImage(trayImageOff);
            }
        }
    };

    /**
     * Keep global reference in object
     *
     * @type {{tray: null, showMainWindow: null}}
     */
    let tray = {
        trayIcon: null,
        showMainWindow: null,
        skipRerender: false
    };

    /**
     * Initializes tray
     *
     * @param showMainWindow
     * @returns {{tray: null, showMainWindow: null}}
     */
    const initTray = (showMainWindow) => {

        tray.showMainWindow = showMainWindow;
        tray.trayIcon = renderTray();

        listeners.addListener((event, options) => {
            if (event === events.PROTECTION_STATUS_CHANGED) {
                setTrayProtectionStatusIcon(tray.trayIcon, options);
            }
        });

        settings.onUpdated.addListener(function (setting) {
            if (setting === settings.SHOW_TRAY_ICON ||
                setting === settings.LAUNCH_AT_LOGIN) {
                if (tray.skipRerender) {
                    tray.skipRerender = false;
                    return;
                }

                if (tray.trayIcon) {
                    tray.trayIcon.destroy();
                }

                tray.trayIcon = renderTray();
            }
        });

        return tray;
    };

    /**
     * Renders tray icon and menu
     *
     * @returns {null}
     */
    const renderTray = () => {
        if (!settings.getProperty(settings.SHOW_TRAY_ICON)) {
            return null;
        }

        const trayIcon = new Tray(trayImageOff);
        trayIcon.setPressedImage(trayImageOff);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: i18n.__('tray_menu_about.message'),
                click: () => {
                    shell.openExternal('https://github.com/AdguardTeam/AdGuardForSafari');
                }
            },
            {
                label: i18n.__('tray_menu_preferences.message'),
                click: () => { tray.showMainWindow(); }
            },
            {
                label: i18n.__('tray_menu_check_updates.message'),
                click: onCheckFiltersUpdateClicked
            },
            { type: "separator" },
            {
                label: i18n.__('tray_menu_protection_start.message'),
                type: "checkbox",
                checked: antibanner.isRunning(),
                click: onProtectionToggleClicked
            },
            { type: "separator" },
            {
                label: i18n.__('tray_menu_launch_at_startup.message'),
                type: "checkbox",
                checked: isOpenAtLoginEnabled(),
                click: onLaunchAdguardAtLoginClicked
            },
            { type: "separator" },
            {
                label: i18n.__('tray_menu_quit.message'),
                click: () => { app.quit(); }
            }
        ]);

        trayIcon.setContextMenu(contextMenu);

        setTrayProtectionStatusIcon(trayIcon, antibanner.isRunning());

        return trayIcon;
    };

    return {
        initTray: initTray
    };

})();