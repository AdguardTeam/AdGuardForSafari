const subscriptions = require('./filters/subscriptions');

/**
 * Filters manager
 */
module.exports = (() => {

    const getFilters = () => {
        return subscriptions.getFilters();
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    const isFilterEnabled = (filterId) => {
        var filter = subscriptions.getFilter(filterId);
        return filter && filter.enabled;
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

    return {
        getFilters: getFilters,
        isFilterEnabled: isFilterEnabled,
        getRequestFilterInfo: getRequestFilterInfo
    };

})();