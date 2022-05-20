const cache = require('../../main/app/filters/cache');
const filtersTags = require('../../main/app/filters/filters-tags');
const filtersMetadata = require('../resources/filtersMetadata.json');

jest.mock('../../main/app/app');

describe('Filters tags tests', () => {
    it('Tags metadata test', () => {
        cache.setData(filtersMetadata);

        const tags = filtersTags.getTags();
        expect(tags).toBeDefined();
        expect(tags.length).toBeGreaterThan(50);

        const baseFilter = filtersMetadata.filters.filter((f) => f.filterId === 1);
        const isRecommended = filtersTags.isRecommendedFilter(baseFilter[0]);
        expect(isRecommended).toBeTruthy();

        let isMobileFilter = filtersTags.isMobileFilter(filtersMetadata.filters[0]);
        expect(isMobileFilter).toBeFalsy();

        const mobileFilter = filtersMetadata.filters.filter((f) => f.filterId === 11);
        isMobileFilter = filtersTags.isMobileFilter(mobileFilter[0]);
        expect(isMobileFilter).toBeTruthy();

        const recommendedFilters = filtersTags.getRecommendedFilters(filtersMetadata.filters);
        recommendedFilters.forEach((filter) => {
            expect(filter.tags.includes(10)).toBeTruthy();
        });
    });
});
