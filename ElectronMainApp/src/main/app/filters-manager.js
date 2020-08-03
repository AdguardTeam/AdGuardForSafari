const listeners = require('../notifier');
const events = require('../events');
const config = require('config');
const subscriptions = require('./filters/subscriptions');
const categories = require('./filters/filters-categories');
const filtersState = require('./filters/filters-state');
const collections = require('./utils/collections');
const log = require('./utils/log');
const filtersUpdate = require('./filters/filters-update');
const serviceClient = require('./filters/service-client');
const appPack = require('../../utils/app-pack');
const fs = require('fs');
const path = require('path');

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
     * Updates groups state info
     * Loads state info from the storage and then updates adguard.subscription.groups properly
     */
    const getGroups = () => {
        // Load groups state from the storage
        const groupsStateInfo = filtersState.getGroupState();

        const groups = subscriptions.getGroups();

        for (let i = 0; i < groups.length; i += 1) {
            const group = groups[i];
            const groupId = group.groupId;
            const stateInfo = groupsStateInfo[groupId];
            if (stateInfo) {
                group.enabled = stateInfo.enabled;
            }
        }
    };

    /**
     * Enables filter group
     *
     * @param groupId
     */
    const enableGroup = function (groupId) {
        const group = subscriptions.getGroup(groupId);
        if (!group || group.enabled) {
            return;
        }

        group.enabled = true;
        listeners.notifyListeners(events.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * Disables filter group
     *
     * @param groupId
     */
    const disableGroup = function (groupId) {
        const group = subscriptions.getGroup(groupId);
        if (!group || !group.enabled) {
            return;
        }

        group.enabled = false;
        listeners.notifyListeners(events.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * @param groupId
     * @returns {Group|boolean|*} true if group is enabled
     */
    const isGroupEnabled = function (groupId) {
        const group = subscriptions.getGroup(groupId);
        return group && group.enabled;
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

        /**
         * We enable group if it wasn't ever enabled or disabled
         * with exceptions of custom filters and SEARCH_AND_SELF_PROMO_FILTER_ID
         */
        const groupId = filter.groupId;
        if (!subscriptions.groupHasEnabledStatus(groupId)) {
            enableGroup(groupId);
        } else if (filterId === config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID
            || groupId === config.get('AntiBannerFilterGroupsId').CUSTOM_FILTERS_GROUP_ID) {
            enableGroup(groupId);
        }

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
     * Removes filter
     *
     * @param {Number} filterId Filter identifier
     */
    const removeFilter = function (filterId) {

        const filter = subscriptions.getFilter(filterId);
        if (!filter || filter.removed) {
            return;
        }

        log.debug("Remove filter {0}", filter.filterId);

        filter.enabled = false;
        filter.installed = false;

        listeners.notifyListeners(events.FILTER_ENABLE_DISABLE, filter);
        listeners.notifyListeners(events.FILTER_ADD_REMOVE, filter);

        if (filter.customUrl) {
            subscriptions.removeCustomFilter(filter);
        } else {
            subscriptions.removeFilter(filterId);
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
     * If group doesn't have enabled property we consider that group is enabled for the first time
     * On first group enable we add and enable recommended filters by groupId
     * On the next calls we just enable group
     *
     * TODO: custom category has it's own logic, check how to work with it too
     *
     * @param {number} groupId
     */
    const enableFiltersGroup = function (groupId) {
        const group = subscriptions.getGroup(groupId);
        if (group && typeof group.enabled === 'undefined') {
            const recommendedFiltersIds = categories.getRecommendedFilterIdsByGroupId(groupId);
            addAndEnableFilters(recommendedFiltersIds);
        }

        enableGroup(groupId);
    };

    /**
     * Disables group
     * @param {number} groupId
     */
    const disableFiltersGroup = function (groupId) {
        disableGroup(groupId);
    };

    /**
     * Offer groups and filters on extension install, select default filters and filters by locale and country
     *
     * @param callback
     */
    const offerGroupsAndFilters = (callback) => {
        const antiBannerFilterGroupsId = config.get('AntiBannerFilterGroupsId');
        let groupIds = [
            antiBannerFilterGroupsId.AD_BLOCKING_ID,
            antiBannerFilterGroupsId.PRIVACY_ID,
            antiBannerFilterGroupsId.LANGUAGE_SPECIFIC_ID
        ];

        callback(groupIds);
    };

    /**
     * Updates filters.json
     * @param {object} metaData
     */
    const updateFiltersJson = (metaData) => {
        const filtersJsonPath = path.resolve(appPack.resourcePath(config.get('localFiltersFolder')) + '/filters.json');
        const updatedData = JSON.stringify(metaData, null, 4)

        fs.writeFileSync(filtersJsonPath, updatedData);
        log.info('Filters.json updated');
    }

    /**
     * Removes obsolete filters
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/134
     */
    const removeObsoleteFilters = () => {
        serviceClient.loadLocalFiltersMetadata(localMetadata => {
            serviceClient.loadRemoteFiltersMetadata(remoteMetadata => {
                updateFiltersJson(remoteMetadata);
                const obsoleteFiltersMetadata = localMetadata.filters.filter((localFilter) => (
                    !remoteMetadata.filters.some((remoteFilter) => (
                        // compare filter's id and name for the case
                        // if id of obsolete filter is given to another filter
                        remoteFilter.filterId === localFilter.filterId && remoteFilter.name === localFilter.name
                    ))
                ))
                obsoleteFiltersMetadata.forEach((filter) => {
                    filtersState.removeFilter(filter.filterId);
                    removeFilter(filter.filterId);
                });
            });
        });
    }

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     */
    const checkAntiBannerFiltersUpdate = (forceUpdate) => {
        filtersUpdate.checkAntiBannerFiltersUpdate(forceUpdate);
    };

    /**
     * Loads filter rules from url, then tries to parse header to filter metadata
     * and adds filter object to subscriptions from it.
     * These custom filters will have special attribute customUrl, from there it could be downloaded and updated.
     *
     * @param url custom url, there rules are
     * @param options object containing title of custom filter
     * @param successCallback
     * @param errorCallback
     */
    const subscribeToCustomFilter = (url, options, successCallback, errorCallback) => {
        log.info('Downloading custom filter from {0}', url);

        errorCallback = errorCallback || function () { };

        if (!url) {
            errorCallback();
            return;
        }

        subscriptions.updateCustomFilter(url, options, filterId => {
            if (filterId) {
                log.info('Custom filter info downloaded');

                const filter = subscriptions.getFilter(filterId);

                successCallback(filter);
            } else {
                errorCallback();
            }
        });
    };

    /**
     * Loads custom filter info from url, but doesn't save filter to storage
     *
     * @param url
     * @param options
     * @param successCallback
     * @param errorCallback
     */
    const loadCustomFilterInfo = (url, options, successCallback, errorCallback) => {
        log.info(`Downloading custom filter info from ${url}`);

        errorCallback = errorCallback || function () { };

        if (!url) {
            errorCallback();
            return;
        }

        subscriptions.getCustomFilterInfo(url, options, (result = {}) => {
            const { error, filter } = result;
            if (filter) {
                log.info('Custom filter data downloaded');
                successCallback(filter);
                return;
            }

            errorCallback(error);
        });
    };

    return {
        getFilters,
        getGroups,
        isFilterEnabled,

        addAndEnableFilters,
        disableFilters,
        removeFilter,

        enableGroup,
        disableGroup,
        isGroupEnabled,

        enableFiltersGroup,
        disableFiltersGroup,

        offerGroupsAndFilters,
        subscribeToCustomFilter,
        loadCustomFilterInfo,

        checkAntiBannerFiltersUpdate,
        removeObsoleteFilters,
    };

})();
