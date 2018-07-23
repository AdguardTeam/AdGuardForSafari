/**
 * Filters manager
 */
module.exports = (function () {

    const getFilters = () => {
        //TODO: Implement
        return [];
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