const subscriptions = require('./subscriptions');
const tagService = require('./filters-tags');
const config = require('config');
const collections = require('../utils/collections');
const {app} = require('electron');

/**
 * Filter categories service
 */
module.exports = (() => {

    'use strict';

    /**
     * Custom filters group identifier
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_ID = 0;

    /**
     * @returns {Array.<*>} filters
     */
    const getFilters = () => {
        const result = subscriptions.getFilters().filter(f => !f.removed);

        const tags = tagService.getTags();

        result.forEach(f => {
            f.tagsDetails = [];
            f.tags.forEach(tagId => {
                const tagDetails = tags.find(tag => tag.tagId === tagId);

                if (tagDetails) {
                    if (tagDetails.keyword.startsWith('reference:')) {
                        // Hide 'reference:' tags
                        return;
                    }

                    if (!tagDetails.keyword.startsWith('lang:')) {
                        // Hide prefixes except of 'lang:'
                        tagDetails.keyword = tagDetails.keyword.substring(tagDetails.keyword.indexOf(':') + 1);
                    }

                    f.tagsDetails.push(tagDetails);
                }
            });
        });

        return result;
    };

    /**
     * Selects filters by groupId
     *
     * @param groupId
     * @param filters
     * @returns {{recommendedFilters, otherFilters: *}}
     */
    const selectFiltersByGroupId = (groupId, filters) => {
        return filters.filter(filter => filter.groupId === groupId);
    };

    /**
     * Constructs filters metadata for options.html page
     *
     * @returns {{filters: Array.<*>, categories: Array}}
     */
    const getFiltersMetadata = () => {
        const groupsMeta = subscriptions.getGroups();
        const filters = getFilters();

        const categories = [];

        for (let i = 0; i < groupsMeta.length; i++) {
            const category = groupsMeta[i];
            category.filters = selectFiltersByGroupId(category.groupId, filters);
            categories.push(category);
        }

        categories.push({
            groupId: CUSTOM_FILTERS_GROUP_ID,
            groupName: 'Custom',
            displayNumber: 99,
            filters: selectFiltersByGroupId(CUSTOM_FILTERS_GROUP_ID, filters)
        });

        return {
            filters: getFilters(),
            categories: categories
        };
    };

    /**
     * @param groupId
     * @returns {Array} recommended filters by groupId
     */
    const getRecommendedFilterIdsByGroupId = groupId => {
        const metadata = getFiltersMetadata();

        const result = [];
        const langSuitableFilters = subscriptions.getFilterIdsForLanguage(app.getLocale());
        for (let i = 0; i < metadata.categories.length; i += 1) {
            const category = metadata.categories[i];
            if (category.groupId === groupId) {
                category.filters.forEach(filter => {
                    if (tagService.isRecommendedFilter(filter)) {
                        // get ids intersection to enable recommended filters matching the lang tag
                        // only if filter has language
                        if (filter.languages && filter.languages.length > 0) {
                            if (langSuitableFilters.includes(filter.filterId)) {
                                result.push(filter.filterId);
                            }
                        } else {
                            result.push(filter.filterId);
                        }
                    }
                });

                return result;
            }
        }

        return result;
    };

    return {
        getFiltersMetadata: getFiltersMetadata,
        getRecommendedFilterIdsByGroupId: getRecommendedFilterIdsByGroupId
    };
})();

