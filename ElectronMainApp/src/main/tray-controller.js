const appPack = require('../utils/app-pack');

const filters = require('./app/filters-manager');
const listeners = require('./notifier');
const antibanner = require('./app/antibanner');
const events = require('./events');

const {app, shell, Tray, Menu} = require('electron');
const AutoLaunch = require('auto-launch');

/**
 * Tray controller.
 * Handles tray events and setups its view state.
 * TODO: Use localizations
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

    const imageFolder = appPack.resourcePath('/src/main/icons');
    const trayImageOff = imageFolder + '/toolbar-off.png';
    const trayImageOn = imageFolder + '/toolbar-on.png';

    /**
     * Initializes icon in tray
     */
    const initTrayIcon = (showWindow) => {

        const isLaunchAtLogin = autoLaunchEnabled;

        const tray = new Tray(trayImageOff);
        tray.setPressedImage(trayImageOff);

        const contextMenu = Menu.buildFromTemplate([{
            label: "About", click: () => {
                shell.openExternal('https://github.com/AdguardTeam');
            }
        }, {
            label: "Preferences",
            submenu: [
                {
                    label: 'General Settings',
                    click: () => {
                        showWindow(() => {
                            listeners.notifyListeners(events.SHOW_OPTIONS_GENERAL);
                        });
                    }
                },
                {
                    label: 'Filters',
                    click: () => {
                        showWindow(() => {
                            listeners.notifyListeners(events.SHOW_OPTIONS_FILTERS);
                        });
                    }
                },
                {
                    label: 'Whitelist',
                    click: () => {
                        showWindow(() => {
                            listeners.notifyListeners(events.SHOW_OPTIONS_WHITELIST);
                        });
                    }
                },
                {
                    label: 'Userfilter',
                    click: () => {
                        showWindow(() => {
                            listeners.notifyListeners(events.SHOW_OPTIONS_USER_FILTER);
                        });
                    }
                }
            ]
        }, {
            label: "Check filters updates", click: onCheckFiltersUpdateClicked
        }, {
            type: "separator"
        }, {
            label: "Launch AdGuard at Login", type: "checkbox",
            checked: isLaunchAtLogin, click: onLaunchAdguardAtLoginClicked
        }, {
            type: "separator"
        }, {
            label: "Quit", click: () => {
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