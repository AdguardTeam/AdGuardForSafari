const path = require('path');
const customFilters = require('../../main/app/filters/custom-filters');
const filtersManager = require('../../main/app/filters-manager');
const cache = require('../../main/app/filters/cache');
const subscriptions = require('../../main/app/filters/subscriptions');

const testFilterPath = path.resolve(__dirname, '../resources', 'test-filter.txt');

describe('Custom filters tests', () => {
    it('Add custom filter', (done) => {
        const filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(0);

        customFilters.addCustomFilter(testFilterPath, { title: 'Test filter', trusted: true }, (filterId) => {
            expect(filterId).toBe(1000);
            const updatedCustomFilters = customFilters.loadCustomFilters();
            expect(updatedCustomFilters).toHaveLength(1);

            const testFilterMeta = updatedCustomFilters[0];
            expect(testFilterMeta.filterId).toEqual(filterId);
            expect(testFilterMeta.enabled).toBeTruthy();

            const isTrusted = filtersManager.isTrustedFilter(filterId);
            expect(isTrusted).toBeTruthy();

            const filtersCache = cache.getFilters();
            expect(filtersCache).toHaveLength(1);

            done();
        });
    });

    it('Update custom filter', (done) => {
        const filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(1);
        const testFilter = filters[0];

        // wait for 1 second to have difference in 'timeUpdated' property
        setTimeout(() => {
            customFilters.updateCustomFilter(testFilter, (filterId) => {
                expect(filterId).toBe(1000);
                const updatedFilters = customFilters.loadCustomFilters();
                expect(updatedFilters).toHaveLength(1);

                const testFilterMeta = updatedFilters[0];
                expect(testFilterMeta.filterId).toEqual(filterId);
                const isTrusted = filtersManager.isTrustedFilter(filterId);

                // check filters state and options
                expect(testFilterMeta.enabled).toBeTruthy();
                expect(isTrusted).toBeTruthy();

                // check cache filters
                const filtersCache = cache.getFilters();
                expect(filtersCache).toHaveLength(1);

                const testFilterDate = new Date(testFilter.timeUpdated).getTime();
                const updatedFilterDate = new Date(testFilterMeta.timeUpdated).getTime();
                const cachedFilterDate = new Date(filtersCache[0].timeUpdated).getTime();

                // compare the dates (timeUpdated property) of inherit, updated and cached filters
                expect(updatedFilterDate).toBeGreaterThan(testFilterDate);
                expect(cachedFilterDate).toEqual(updatedFilterDate);

                done();
            });
        }, 1000);
    });

    it('Remove custom filter', () => {
        let filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(1);

        const testFilterMeta = filters[0];
        customFilters.removeCustomFilter(testFilterMeta);
        // remove from cache
        cache.removeFilter(testFilterMeta.filterId);

        filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(0);

        const filtersCache = cache.getFilters();
        expect(filtersCache).toHaveLength(0);
    });
});
