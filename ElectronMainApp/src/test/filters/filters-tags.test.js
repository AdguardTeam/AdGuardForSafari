const cache = require('../../main/app/filters/cache');
const filtersTags = require('../../main/app/filters/filters-tags');
const serviceClient = require('../../main/app/filters/service-client');

jest.mock('../../main/app/app');

describe('Filters tags tests', () => {
    it('Tags metadata test', (done) => {
        serviceClient.loadRemoteFiltersMetadata((metadata) => {
            cache.setData(metadata);

            const tags = filtersTags.getTags();
            expect(tags).toBeDefined();
            expect(tags.length).toBeGreaterThan(50);

            const baseFilter = metadata.filters.filter((f) => f.filterId === 1);
            const isRecommended = filtersTags.isRecommendedFilter(baseFilter[0]);
            expect(isRecommended).toBeTruthy();

            let isMobileFilter = filtersTags.isMobileFilter(metadata.filters[0]);
            expect(isMobileFilter).toBeFalsy();

            const mobileFilter = metadata.filters.filter((f) => f.filterId === 11);
            isMobileFilter = filtersTags.isMobileFilter(mobileFilter[0]);
            expect(isMobileFilter).toBeTruthy();

            const recommendedFilters = filtersTags.getRecommendedFilters(metadata.filters);
            recommendedFilters.forEach((filter) => {
                expect(filter.tags.includes(10)).toBeTruthy();
            });

            done();
        });
    });
});
