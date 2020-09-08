// module.exports = (function () {
//
//     let tags = [];
//     let groups = [];
//     let groupsMap = {};
//     let filters = [];
//     let filtersMap = {};
//
//     /**
//      * Gets filter metadata by filter identifier
//      */
//     const getFilter = (filterId) => filtersMap[filterId];
//
//     /**
//      * @returns Array of Filters metadata
//      */
//     const getFilters = () => filters;
//
//     /**
//      * @returns Object of Filters metadata
//      */
//     const getFiltersMap = () => filtersMap;
//
//     /**
//      * Removes filter metadata by id
//      * @param filterId
//      */
//     const removeFilter = (filterId) => {
//         filters = filters.filter((f) => f.filterId !== filterId);
//         delete filtersMap[filterId];
//     };
//
//     /**
//      * Updates filter metadata
//      * @param filter
//      */
//     const updateFilters = (filter) => {
//         removeFilter(filter.filterId);
//         filters.push(filter);
//         filtersMap[filter.filterId] = filter;
//     };
//
//     /**
//      * @returns Group metadata
//      */
//     const getGroup = (groupId) => groupsMap[groupId];
//
//     /**
//      * @returns Array of Groups metadata
//      */
//     const getGroups = () => groups;
//
//     /**
//      * @returns Array of Tags metadata
//      */
//     const getTags = () => tags;
//
//     return {
//         getFilter,
//         getFilters,
//         getFiltersMap,
//         removeFilter,
//         updateFilters,
//         getGroup,
//         getGroups,
//         getTags,
//     };
// })();
