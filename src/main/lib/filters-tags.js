const subscriptions = require('./subscriptions');
const filterUtils = require('./utils/filter-utils');

/**
 * Filter tags service
 */
module.exports = (() =>{

    'use strict';

    const RECOMMENDED_TAG_ID = 10;

    const PURPOSE_ADS_TAG_ID = 1;
    const PURPOSE_PRIVACY_TAG_ID = 2;
    const PURPOSE_SOCIAL_TAG_ID = 3;
    const PURPOSE_SECURITY_TAG_ID = 4;
    const PURPOSE_ANNOYANCES_TAG_ID = 5;
    const PURPOSE_COOKIES_TAG_ID = 6;

    const getTags = () => subscriptions.getTags();

    const getFilters = () => subscriptions.getFilters().filter(f => f.filterId !== filterUtils.ids.SEARCH_AND_SELF_PROMO_FILTER_ID);

    const getFiltersByTagId = (tagId, filters) => filters.filter(f => f.tags.indexOf(tagId) >= 0);

    const getRecommendedFilters = filters => getFiltersByTagId(RECOMMENDED_TAG_ID, filters);

    const getPurposeGroupedFilters = () =>{
        const filters = getFilters();
        const adsFilters = getFiltersByTagId(PURPOSE_ADS_TAG_ID, filters);
        const socialFilters = getFiltersByTagId(PURPOSE_SOCIAL_TAG_ID, filters);
        const privacyFilters = getFiltersByTagId(PURPOSE_PRIVACY_TAG_ID, filters);
        const annoyancesFilters = getFiltersByTagId(PURPOSE_ANNOYANCES_TAG_ID, filters);
        const cookiesFilters = getFiltersByTagId(PURPOSE_COOKIES_TAG_ID, filters);
        const securityFilters = getFiltersByTagId(PURPOSE_SECURITY_TAG_ID, filters);

        return {
            ads: adsFilters,
            social: socialFilters,
            privacy: privacyFilters,
            security: securityFilters,
            annoyances: annoyancesFilters,
            cookies: cookiesFilters
        };
    };

    return {
        getTags: getTags,
        getPurposeGroupedFilters: getPurposeGroupedFilters,
        getFiltersByTagId: getFiltersByTagId,
        getRecommendedFilters: getRecommendedFilters
    };
})();

