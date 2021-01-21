const safariToolbar = require('safari-ext');
const localStorage = require('./storage/storage');
const cache = require('./utils/cache');
const log = require('./utils/log');
const channels = require('./utils/channels');
const listeners = require('../notifier');
const events = require('../events');

/**
 * Object that manages user settings.
 * @constructor
 */
module.exports = (function () {
    'use strict';

    const DEFAULT_FILTERS_UPDATE_PERIOD = -1;

    const settings = {
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_SEND_SAFEBROWSING_STATS: 'safebrowsing-stats-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        USERRULES_ENABLED: 'userrules-enabled',
        ALLOWLIST_ENABLED: 'allowlist-enabled',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode',
        DISABLE_SHOW_APP_UPDATED_NOTIFICATION: 'show-app-updated-disabled',
        DISABLE_HARDWARE_ACCELERATION: 'hardware-acceleration-disabled',
        UPDATE_FILTERS_PERIOD: 'update-filters-period',
        SHOW_TRAY_ICON: 'show-tray-icon',
        LAUNCH_AT_LOGIN: 'launch-at-login',
        VERBOSE_LOGGING: 'verbose-logging',
        QUIT_ON_CLOSE_WINDOW: 'quit-on-close-main-window',
    };

    const properties = Object.create(null);
    const propertyUpdateChannel = channels.newChannel();

    /**
     * Lazy default properties
     */
    const defaultProperties = {
        get defaults() {
            return cache.lazyGet(this, 'defaults', () => {
                // Initialize default properties
                const defaults = Object.create(null);
                for (const name in settings) {
                    if (settings.hasOwnProperty(name)) {
                        defaults[settings[name]] = false;
                    }
                }

                defaults[settings.DISABLE_SAFEBROWSING] = true;
                defaults[settings.DISABLE_SEND_SAFEBROWSING_STATS] = true;
                defaults[settings.DEFAULT_WHITE_LIST_MODE] = true;
                defaults[settings.USERRULES_ENABLED] = true;
                defaults[settings.ALLOWLIST_ENABLED] = true;
                defaults[settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION] = false;
                defaults[settings.DISABLE_HARDWARE_ACCELERATION] = false;
                defaults[settings.UPDATE_FILTERS_PERIOD] = 48;
                defaults[settings.SHOW_TRAY_ICON] = true;
                defaults[settings.LAUNCH_AT_LOGIN] = false;
                defaults[settings.VERBOSE_LOGGING] = false;
                defaults[settings.QUIT_ON_CLOSE_WINDOW] = -1;

                return defaults;
            });
        },
    };

    const getProperty = function (propertyName) {
        if (propertyName in properties) {
            return properties[propertyName];
        }

        let propertyValue = null;

        if (localStorage.hasItem(propertyName)) {
            try {
                propertyValue = JSON.parse(localStorage.getItem(propertyName));
            } catch (ex) {
                log.error('Error get property {0}, cause: {1}', propertyName, ex);
            }
        } else if (propertyName in defaultProperties.defaults) {
            propertyValue = defaultProperties.defaults[propertyName];
        }

        properties[propertyName] = propertyValue;

        return propertyValue;
    };

    const setProperty = function (propertyName, propertyValue) {
        localStorage.setItem(propertyName, propertyValue);
        properties[propertyName] = propertyValue;
        propertyUpdateChannel.notify(propertyName, propertyValue);
    };

    const getAllSettings = function () {
        const result = {
            names: Object.create(null),
            values: Object.create(null),
        };

        for (const key in settings) {
            if (settings.hasOwnProperty(key)) {
                const setting = settings[key];
                result.names[key] = setting;
                result.values[setting] = getProperty(setting);
            }
        }

        return result;
    };

    /**
     * True if filtering is disabled globally.
     *
     * @returns {boolean} true if disabled
     */
    const isFilteringDisabled = function () {
        return getProperty(settings.DISABLE_FILTERING);
    };

    const changeFilteringDisabled = function (disabled) {
        setProperty(settings.DISABLE_FILTERING, disabled);
    };

    const isShowAppUpdatedNotification = function () {
        return !getProperty(settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION);
    };

    const changeShowAppUpdatedNotification = (value) => {
        setProperty(settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, value);

        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION,
            propertyValue: value,
            inverted: true,
        });
    };

    const changeEnableSafebrowsing = function (enabled) {
        setProperty(settings.DISABLE_SAFEBROWSING, !enabled);
    };

    const changeSendSafebrowsingStats = function (enabled, options) {
        setProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS, !enabled, options);
    };

    const getSafebrowsingInfo = function () {
        return {
            enabled: !getProperty(settings.DISABLE_SAFEBROWSING),
            sendStats: !getProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS),
        };
    };

    const isDefaultWhiteListMode = function () {
        return getProperty(settings.DEFAULT_WHITE_LIST_MODE);
    };

    const changeDefaultWhiteListMode = function (enabled) {
        setProperty(settings.DEFAULT_WHITE_LIST_MODE, enabled);
    };

    const updateDefaultWhiteListMode = (value) => {
        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.DEFAULT_WHITE_LIST_MODE,
            propertyValue: value,
            inverted: true,
        });
    };

    const changeUpdateFiltersPeriod = (period) => {
        let periodNum = Number.parseInt(period, 10);
        if (Number.isNaN(periodNum)) {
            periodNum = DEFAULT_FILTERS_UPDATE_PERIOD;
        }
        setProperty(settings.UPDATE_FILTERS_PERIOD, periodNum);
        listeners.notifyListeners(events.FILTERS_PERIOD_UPDATED, periodNum);
    };

    const getUpdateFiltersPeriod = () => {
        return getProperty(settings.UPDATE_FILTERS_PERIOD);
    };

    const changeLaunchAtLogin = (value) => {
        setProperty(settings.LAUNCH_AT_LOGIN, value);
        safariToolbar.setStartAtLogin(value);

        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.LAUNCH_AT_LOGIN,
            propertyValue: value,
            inverted: false,
        });
    };

    const isLaunchAtLoginEnabled = () => {
        return getProperty(settings.LAUNCH_AT_LOGIN);
    };

    const isShowTrayIconEnabled = () => {
        return getProperty(settings.SHOW_TRAY_ICON);
    };

    const changeShowTrayIcon = (value) => {
        setProperty(settings.SHOW_TRAY_ICON, value);

        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.SHOW_TRAY_ICON,
            propertyValue: value,
            inverted: false,
        });
    };

    const isVerboseLoggingEnabled = function () {
        return getProperty(settings.VERBOSE_LOGGING);
    };

    const changeVerboseLogging = (value) => {
        setProperty(settings.VERBOSE_LOGGING, value);
        safariToolbar.setVerboseLogging(value);

        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.VERBOSE_LOGGING,
            propertyValue: value,
            inverted: false,
        });
    };

    const isHardwareAccelerationDisabled = function () {
        return getProperty(settings.DISABLE_HARDWARE_ACCELERATION);
    };

    const changeHardwareAcceleration = (value) => {
        setProperty(settings.DISABLE_HARDWARE_ACCELERATION, value);

        listeners.notifyListeners(events.SETTING_UPDATED, {
            propertyName: settings.DISABLE_HARDWARE_ACCELERATION,
            propertyValue: value,
            inverted: true,
        });
    };

    const isQuitOnCloseWindow = function () {
        return getProperty(settings.QUIT_ON_CLOSE_WINDOW);
    };

    const changeQuitOnCloseWindow = function (value) {
        setProperty(settings.QUIT_ON_CLOSE_WINDOW, value);
    };

    const isUserrulesEnabled = function () {
        return getProperty(settings.USERRULES_ENABLED);
    };

    const changeUserrulesState = function (value) {
        setProperty(settings.USERRULES_ENABLED, value);
        log.info(`User rules ${value ? 'enabled' : 'disabled'}`);
        // TODO enable/disable user rules
    };

    const isAllowlistEnabled = function () {
        return getProperty(settings.ALLOWLIST_ENABLED);
    };

    const changeAllowlistState = function (value) {
        setProperty(settings.ALLOWLIST_ENABLED, value);
        log.info(`Allowlist ${value ? 'enabled' : 'disabled'}`);
        // TODO enable/disable allowlist
    };

    const api = {};

    // Expose settings to api
    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            api[key] = settings[key];
        }
    }

    api.getProperty = getProperty;
    api.setProperty = setProperty;
    api.getAllSettings = getAllSettings;

    api.onUpdated = propertyUpdateChannel;

    api.isFilteringDisabled = isFilteringDisabled;
    api.changeFilteringDisabled = changeFilteringDisabled;
    api.isShowAppUpdatedNotification = isShowAppUpdatedNotification;
    api.changeShowAppUpdatedNotification = changeShowAppUpdatedNotification;
    api.changeEnableSafebrowsing = changeEnableSafebrowsing;
    api.changeSendSafebrowsingStats = changeSendSafebrowsingStats;
    api.getSafebrowsingInfo = getSafebrowsingInfo;
    api.isDefaultWhiteListMode = isDefaultWhiteListMode;
    api.changeDefaultWhiteListMode = changeDefaultWhiteListMode;
    api.updateDefaultWhiteListMode = updateDefaultWhiteListMode;
    api.changeUpdateFiltersPeriod = changeUpdateFiltersPeriod;
    api.getUpdateFiltersPeriod = getUpdateFiltersPeriod;
    api.changeLaunchAtLogin = changeLaunchAtLogin;
    api.isLaunchAtLoginEnabled = isLaunchAtLoginEnabled;
    api.isShowTrayIconEnabled = isShowTrayIconEnabled;
    api.changeShowTrayIcon = changeShowTrayIcon;
    api.isVerboseLoggingEnabled = isVerboseLoggingEnabled;
    api.changeVerboseLogging = changeVerboseLogging;
    api.isHardwareAccelerationDisabled = isHardwareAccelerationDisabled;
    api.changeHardwareAcceleration = changeHardwareAcceleration;
    api.isQuitOnCloseWindow = isQuitOnCloseWindow;
    api.changeQuitOnCloseWindow = changeQuitOnCloseWindow;
    api.isUserrulesEnabled = isUserrulesEnabled;
    api.changeUserrulesState = changeUserrulesState;
    api.isAllowlistEnabled = isAllowlistEnabled;
    api.changeAllowlistState = changeAllowlistState;

    return api;
})();
