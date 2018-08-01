const listeners = require('../../notifier');
const events = require('../../events');
const localStorage = require('../storage/storage');

/**
 * Helper class for working with filters metadata storage (local storage)
 */
module.exports = (() => {

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
            console.error("Error retrieve filters version info, cause {0}", ex);
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
            console.error("Error retrieve filters state info, cause {0}", ex);
        }

        return filters;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    const updateFilterVersion = filter => {
        const filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };

        localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    const updateFilterState = filter => {
        const filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };

        localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    listeners.addListener((event, filter) => {
        switch (event) {
            case listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(filter);
                updateFilterVersion(filter);
                break;
            case listeners.FILTER_ADD_REMOVE:
            case listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(filter);
                break;
        }
    });

    return {
        getFiltersVersion: getFiltersVersion,
        getFiltersState: getFiltersState,
        updateFilterVersion: updateFilterVersion,
        updateFilterState: updateFilterState
    };

})();