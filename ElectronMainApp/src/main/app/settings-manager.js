const localStorage = require('./storage/storage');
const cache = require('./utils/cache');
const log = require('./utils/log');
const channels = require('./utils/channels');
/**
 * Object that manages user settings.
 * @constructor
 */
module.exports = (function () {

    'use strict';

    const settings = {
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_SEND_SAFEBROWSING_STATS: 'safebrowsing-stats-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        USE_OPTIMIZED_FILTERS: 'use-optimized-filters',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode',
        DISABLE_SHOW_APP_UPDATED_NOTIFICATION: 'show-app-updated-disabled',
        UPDATE_FILTERS_PERIOD: 'update-filters-period'
    };

    const properties = Object.create(null);
    const propertyUpdateChannel = channels.newChannel();

    /**
     * Lazy default properties
     */
    const defaultProperties = {
        get defaults() {
            return cache.lazyGet(this, 'defaults', function () {
                // Initialize default properties
                const defaults = Object.create(null);
                for (let name in settings) {
                    if (settings.hasOwnProperty(name)) {
                        defaults[settings[name]] = false;
                    }
                }

                defaults[settings.DISABLE_SAFEBROWSING] = true;
                defaults[settings.DISABLE_SEND_SAFEBROWSING_STATS] = true;
                defaults[settings.DEFAULT_WHITE_LIST_MODE] = true;
                defaults[settings.USE_OPTIMIZED_FILTERS] = true;
                defaults[settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION] = false;
                defaults[settings.UPDATE_FILTERS_PERIOD] = 48;

                return defaults;
            });
        }
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
            values: Object.create(null)
        };

        for (let key in settings) {
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

    const changeShowAppUpdatedNotification = function (show, options) {
        setProperty(settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, !show, options);
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
            sendStats: !getProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS)
        };
    };

    const isDefaultWhiteListMode = function () {
        return getProperty(settings.DEFAULT_WHITE_LIST_MODE);
    };

    const isUseOptimizedFiltersEnabled = function () {
        return getProperty(settings.USE_OPTIMIZED_FILTERS);
    };

    const changeUseOptimizedFiltersEnabled = function (enabled, options) {
        setProperty(settings.USE_OPTIMIZED_FILTERS, !!enabled, options);
    };

    const changeDefaultWhiteListMode = function (enabled) {
        setProperty(settings.DEFAULT_WHITE_LIST_MODE, enabled);
    };

    const changeUpdateFiltersPeriod = (value) => {
        setProperty(settings.UPDATE_FILTERS_PERIOD, value);
    }

    const getUpdateFiltersPeriod = () => {
        return getProperty(settings.UPDATE_FILTERS_PERIOD);
    }

    const api = {};

    // Expose settings to api
    for (let key in settings) {
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
    api.isUseOptimizedFiltersEnabled = isUseOptimizedFiltersEnabled;
    api.changeUseOptimizedFiltersEnabled = changeUseOptimizedFiltersEnabled;
    api.changeDefaultWhiteListMode = changeDefaultWhiteListMode;
    api.changeUpdateFiltersPeriod = changeUpdateFiltersPeriod;
    api.getUpdateFiltersPeriod = getUpdateFiltersPeriod;

    return api;

})();
