const listeners = require('../notifier');
const events = require('../events');
const config = require('config');
const subscriptions = require('./filters/subscriptions');
const categories = require('./filters/filters-categories');
const filtersState = require('./filters/filters-state');
const collections = require('./utils/collections');
const log = require('./utils/log');
const filtersUpdate = require('./filters/filters-update');

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
        listeners.notifyListeners(events.FILTER_ENABLE_DISABLE, filter);
        log.info('Filter {0} enabled successfully', filterId);
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
                listeners.notifyListeners(events.FILTER_ADD_REMOVE, filter);
            }
            callback(success);
        };

        if (filter.loaded) {
            onFilterLoaded(true);
            return;
        }

        filtersUpdate.loadFilterRules(filter, false, onFilterLoaded);

        log.info('Filter {0} added successfully', filterId);
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
            listeners.notifyListeners(events.FILTER_ENABLE_DISABLE, filter);

            log.info('Filter {0} disabled successfully', filter.filterId);
        }
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
     * Offer filters on extension install, select default filters and filters by locale and country
     *
     * @param callback
     */
    const offerFilters = (callback) => {
        // These filters are enabled by default
        let filterIds = [config.AntiBannerFiltersId.ENGLISH_FILTER_ID, config.AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID];

        // Get language-specific filters by user locale
        let localeFilterIds = subscriptions.getFilterIdsForLanguage(i18n.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        callback(filterIds);
    };

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     * @param successCallback Called if filters were updated successfully
     * @param errorCallback Called if something gone wrong
     */
    const checkAntiBannerFiltersUpdate = (forceUpdate, successCallback, errorCallback) => {
        filtersUpdate.checkAntiBannerFiltersUpdate(forceUpdate, successCallback, errorCallback);
    };

    return {
        getFilters: getFilters,
        isFilterEnabled: isFilterEnabled,

        addAndEnableFilters: addAndEnableFilters,
        disableFilters: disableFilters,

        addAndEnableFiltersByGroupId: addAndEnableFiltersByGroupId,
        disableAntiBannerFiltersByGroupId: disableAntiBannerFiltersByGroupId,

        offerFilters: offerFilters,

        checkAntiBannerFiltersUpdate: checkAntiBannerFiltersUpdate
    };

})();