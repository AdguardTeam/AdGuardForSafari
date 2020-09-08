const path = require('path');
const subscriptions = require('../../main/app/filters/subscriptions');
const customFilters = require('../../main/app/filters/custom-filters');

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

            const isTrusted = customFilters.isTrustedFilter(filterId);
            expect(isTrusted).toBeTruthy();
            done();
        });
    });

    it('Update custom filter', (done) => {
        const filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(1);
        const testFilter = filters[0];

        customFilters.updateCustomFilter(testFilter, (filterId) => {
            expect(filterId).toBe(1000);
            const updatedFilters = customFilters.loadCustomFilters();
            expect(updatedFilters).toHaveLength(1);

            const testFilterMeta = updatedFilters[0];
            expect(testFilterMeta.filterId).toEqual(filterId);
            expect(testFilterMeta.enabled).toBeTruthy();

            const isTrusted = customFilters.isTrustedFilter(filterId);
            expect(isTrusted).toBeTruthy();
            done();
        });
    });

    it('Remove custom filter', () => {
        let filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(1);

        const testFilterMeta = filters[0];
        customFilters.removeCustomFilter(testFilterMeta);
        // remove from cache
        subscriptions.removeFilter(testFilterMeta.filterId);

        filters = customFilters.loadCustomFilters();
        expect(filters).toHaveLength(0);
    });
});
