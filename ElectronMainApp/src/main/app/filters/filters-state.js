const listeners = require('../../notifier');
const events = require('../../events');
const localStorage = require('../storage/storage');
const log = require('../utils/log');

/**
 * Helper class for working with filters metadata storage (local storage)
 */
module.exports = (() => {
    const GROUPS_STATE_PROP = 'groups-state';
    const FILTERS_STATE_PROP = 'filters-state';
    const FILTERS_VERSION_PROP = 'filters-version';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    const getFiltersVersion = () => {
        let filters = Object.create(null);
        try {
            const json = localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters version info, cause {0}', ex);
        }

        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    const getFiltersState = () => {
        let filters = Object.create(null);
        try {
            const json = localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters state info, cause {0}', ex);
        }

        return filters;
    };

    /**
     * Gets groups state from the local storage
     */
    const getGroupState = () => {
        let groups = Object.create(null);
        try {
            const json = localStorage.getItem(GROUPS_STATE_PROP);
            if (json) {
                groups = JSON.parse(json);
            }
        } catch (e) {
            log.error('Error retrieve groups state info, cause {0}', e);
        }
        return groups;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    const updateFilterVersion = (filter) => {
        const filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime,
        };

        localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    const updateFilterState = (filter) => {
        const filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed,
            removed: filter.removed,
        };

        localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    /**
     * Removes filter from the local storage
     * @param filterId
     */
    const removeFilter = (filterId) => {
        const filters = getFiltersState();
        delete filters[filterId];
        localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    /**
     * Updates group enable state in the local storage
     *
     * @param group - SubscriptionGroup object
     */
    const updateGroupState = function (group) {
        const groups = getGroupState();
        groups[group.groupId] = {
            enabled: group.enabled,
        };

        localStorage.setItem(GROUPS_STATE_PROP, JSON.stringify(groups));
    };

    /**
     * Initialize
     */
    const init = () => {
        listeners.addListener((event, payload) => {
            switch (event) {
                case events.SUCCESS_DOWNLOAD_FILTER:
                    updateFilterState(payload);
                    updateFilterVersion(payload);
                    break;
                case events.FILTER_ADD_REMOVE:
                case events.FILTER_ENABLE_DISABLE:
                    updateFilterState(payload);
                    break;
                case events.FILTER_GROUP_ENABLE_DISABLE:
                    updateGroupState(payload);
                    break;
            }
        });
    };

    return {
        init,
        getFiltersVersion,
        getFiltersState,
        getGroupState,
        updateFilterVersion,
        updateFilterState,
        updateGroupState,
        removeFilter,
    };
})();
