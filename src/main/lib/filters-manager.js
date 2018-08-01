const listeners = require('../notifier');
const config = require('config');
const subscriptions = require('./filters/subscriptions');
const categories = require('./filters/filters-categories');
const filtersState = require('./filters/filters-state');
const events = require('../events');
const serviceClient = require('./filters/service-client');
const settings = require('./settings-manager');
const collections = require('./utils/collections');
const rulesStorage = require('./storage/rules-storage');


/**
 * Filters manager
 */
module.exports = (() => {

    const USER_FILTER_ID = config.get('AntiBannerFiltersId').USER_FILTER_ID;

    let loadedRules = null;

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from adguard.subscriptions.getFilter
     * @private
     */
    const getFilterById = (filterId) => {
        let filter = subscriptions.getFilter(filterId);
        if (!filter) {
            throw 'Filter with id ' + filterId + ' not found';
        }

        return filter;
    };

    /**
     * Loads filters metadata
     */
    const getFilters = () => {

        // Load filters metadata from the storage
        const filtersVersionInfo = filtersState.getFiltersVersion();
        // Load filters state from the storage
        const filtersStateInfo = filtersState.getFiltersState();

        const filters = subscriptions.getFilters();

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            const filterId = filter.filterId;
            const versionInfo = filtersVersionInfo[filterId];
            const stateInfo = filtersStateInfo[filterId];
            if (versionInfo) {
                filter.version = versionInfo.version;
                filter.lastCheckTime = versionInfo.lastCheckTime;
                filter.lastUpdateTime = versionInfo.lastUpdateTime;
            }
            if (stateInfo) {
                filter.enabled = stateInfo.enabled;
                filter.installed = stateInfo.installed;
                filter.loaded = stateInfo.loaded;
            }
        }

        return filters;
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    const isFilterEnabled = (filterId) => {
        const filter = subscriptions.getFilter(filterId);
        const filtersStateInfo = filtersState.getFiltersState();
        const stateInfo = filtersStateInfo[filterId];
        return filter && stateInfo && stateInfo.enabled;
    };

    /**
     * Request Filter info
     *
     * @returns {{rulesCount: number}}
     */
    const getRequestFilterInfo = () => {
        let rulesCount = 0;
        if (loadedRules) {
            rulesCount = loadedRules.length;
        }

        return {
            rulesCount: rulesCount
        };
    };

    /**
     * Enables filter
     *
     * @param filterId
     */
    const enableFilter = (filterId) => {
        if (isFilterEnabled(filterId)) {
            return;
        }

        let filter = subscriptions.getFilter(filterId);
        filter.enabled = true;
        listeners.notifyListeners(listeners.FILTER_ENABLE_DISABLE, filter);
        //adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED, options);
    };

    /**
     * Loads filter
     *
     * @param filterId
     * @param callback
     */
    const addAntiBannerFilter = (filterId, callback) => {
        const filter = getFilterById(filterId);
        if (filter.installed) {
            callback(true);
            return;
        }

        const onFilterLoaded = function (success) {
            if (success) {
                filter.installed = true;
                listeners.notifyListeners(listeners.FILTER_ADD_REMOVE, filter);
            }
            callback(success);
        };

        if (filter.loaded) {
            onFilterLoaded(true);
            return;
        }

        loadFilterRules(filter, false, onFilterLoaded);
    };

    /**
     * Loads filter rules
     *
     * @param filterMetadata Filter metadata
     * @param forceRemote Force download filter rules from remote server (if false try to download local copy of rules if it's possible)
     * @param callback Called when filter rules have been loaded
     * @private
     */
    const loadFilterRules = (filterMetadata, forceRemote, callback) => {

        const filter = getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        listeners.notifyListeners(listeners.START_DOWNLOAD_FILTER, filter);

        const successCallback = function (filterRules) {
            console.info("Retrieved response from server for filter {0}, rules count: {1}", filter.filterId, filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.lastCheckTime = Date.now();
            filter.loaded = true;
            //notify listeners
            listeners.notifyListeners(listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            listeners.notifyListeners(listeners.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        };

        const errorCallback = function (cause) {
            console.error("Error retrieved response from server for filter {0}, cause: {1}", filter.filterId, cause || "");
            delete filter._isDownloading;
            listeners.notifyListeners(adguard.listeners.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        serviceClient.loadFilterRules(filter.filterId, forceRemote, settings.isUseOptimizedFiltersEnabled(), successCallback, errorCallback);
    };

    /**
     * Loads and enables filters
     *
     * @param filterIds
     */
    const addAndEnableFilters = (filterIds) => {

        if (!filterIds || filterIds.length === 0) {
            return;
        }

        filterIds = collections.removeDuplicates(filterIds.slice(0));

        const loadNextFilter = function () {
            if (filterIds.length === 0) {
                return;
            } else {
                const filterId = filterIds.shift();
                addAntiBannerFilter(filterId, function (success) {
                    if (success) {
                        enableFilter(filterId);
                    }

                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    };

    /**
     * Disables filters
     *
     * @param filterIds
     */
    const disableFilters = (filterIds) => {
        filterIds = collections.removeDuplicates(filterIds.slice(0));

        for (let i = 0; i < filterIds.length; i++) {
            const filterId = filterIds[i];
            if (!isFilterEnabled(filterId)) {
                return;
            }

            const filter = subscriptions.getFilter(filterId);
            filter.enabled = false;
            listeners.notifyListeners(listeners.FILTER_ENABLE_DISABLE, filter);
        }

        //adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED, options);
    };

    /**
     * Adds and enables recommended filters by groupId
     *
     * @param groupId
     */
    const addAndEnableFiltersByGroupId = (groupId) => {
        const idsByTagId = categories.getRecommendedFilterIdsByGroupId(groupId);

        addAndEnableFilters(idsByTagId);
    };

    /**
     * Disables recommended filters by groupId
     *
     * @param groupId
     */
    const disableAntiBannerFiltersByGroupId = (groupId) => {
        const idsByTagId = categories.getRecommendedFilterIdsByGroupId(groupId);

        disableFilters(idsByTagId);
    };

    /**
     * Loads filter rules from storage
     *
     * @param filterId Filter identifier
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     */
    const loadFilterRulesFromStorage = (filterId, rulesFilterMap) => {
        return new Promise((resolve) => {
            rulesStorage.read(filterId, rulesText => {
                if (rulesText) {
                    rulesFilterMap[filterId] = rulesText;
                }

                resolve();
            });
        });
    };

    /**
     * Adds user rules (got from the storage)
     *
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     * @private
     */
    function loadUserRules(rulesFilterMap) {
        return new Promise((resolve) => {
            rulesStorage.read(USER_FILTER_ID, rulesText => {
                if (!rulesText) {
                    resolve();
                    return;
                }

                rulesFilterMap[USER_FILTER_ID] = rulesText;
                resolve();
            });
        });
    }

    /**
     * Loads rules for all enabled filters
     */
    const loadRules = (callback) => {
        const filters = getFilters();
        filters.filter((f) => {
            return f.enabled;
        });

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        const rulesFilterMap = Object.create(null);

        const dfds = [];
        filters.forEach((f) => {
            dfds.push(loadFilterRulesFromStorage(f.filterId, rulesFilterMap));
        });

        dfds.push(loadUserRules(rulesFilterMap));

        Promise.all(dfds).then(() => {
            let rules = [];

            for (let filterId in rulesFilterMap) {
                filterId = filterId - 0;
                if (filterId !== USER_FILTER_ID) {
                    let rulesTexts = rulesFilterMap[filterId];
                    rules = rules.concat(rulesTexts);
                }
            }

            loadedRules = rules;

            callback(rules);
        });
    };

    /**
     * Returns rules for all enabled filters
     *
     * @param callback
     */
    const getRules = (callback) => {
        if (!loadedRules) {
            loadRules((rules) => {
                callback(rules);
            });
        } else {
            callback(loadedRules);
        }
    };

    return {
        getFilters: getFilters,
        isFilterEnabled: isFilterEnabled,
        getRequestFilterInfo: getRequestFilterInfo,

        addAndEnableFilters: addAndEnableFilters,
        disableFilters: disableFilters,

        addAndEnableFiltersByGroupId: addAndEnableFiltersByGroupId,
        disableAntiBannerFiltersByGroupId: disableAntiBannerFiltersByGroupId,

        getRules: getRules,
        loadRules: loadRules
    };

})();