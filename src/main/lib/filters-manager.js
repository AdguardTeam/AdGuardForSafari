const subscriptions = require('./subscriptions');

/**
 * Filters manager
 */
module.exports = (function () {

    const getFilters = () => {
        let filters = subscriptions.getFilters();
        return filters;
    };

    const isFilterEnabled = () => {
        //TODO: Implement
        return true;
    };

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