const listeners = require('../notifier');

const subscriptions = require('./filters/subscriptions');
const categories = require('./filters/filters-categories');
const filtersState = require('./filters/filters-state');
const events = require('../events');

/**
 * Filters manager
 */
module.exports = (() => {

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from adguard.subscriptions.getFilter
     * @private
     */
    const getFilterById = (filterId) => {
        var filter = subscriptions.getFilter(filterId);
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
        //TODO: Implement

        return {
            rulesCount: 0
        };
    };

    const enableFilter = (filterId) => {
        if (isFilterEnabled(filterId)) {
            return;
        }

        let filter = subscriptions.getFilter(filterId);
        filter.enabled = true;
        listeners.notifyListeners(listeners.FILTER_ENABLE_DISABLE, filter);
        //adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED, options);
    };

    const removeDuplicates = (arr) => {
        if (!arr || arr.length === 1) {
            return arr;
        }
        return arr.filter(function (elem, pos) {
            return arr.indexOf(elem) === pos;
        });
    };

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

        /**
         * TODO: when we want to load filter from backend, we should retrieve metadata from backend too, but not from local file.
         */
        //TODO: Load rules
        //loadFilterRules(filter, false, onFilterLoaded);
        onFilterLoaded(true);
    };

    const addAndEnableFilters = (filterIds) => {

        if (!filterIds || filterIds.length === 0) {
            return;
        }

        filterIds = removeDuplicates(filterIds.slice(0));

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

    const disableFilters = (filterIds) => {
        filterIds = removeDuplicates(filterIds.slice(0));

        for (let i = 0; i < filterIds.length; i++) {
            var filterId = filterIds[i];
            if (!isFilterEnabled(filterId)) {
                return;
            }

            var filter = subscriptions.getFilter(filterId);
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

    return {
        getFilters: getFilters,
        isFilterEnabled: isFilterEnabled,
        getRequestFilterInfo: getRequestFilterInfo,

        addAndEnableFilters: addAndEnableFilters,
        disableFilters: disableFilters,

        addAndEnableFiltersByGroupId: addAndEnableFiltersByGroupId,
        disableAntiBannerFiltersByGroupId: disableAntiBannerFiltersByGroupId
    };

})();