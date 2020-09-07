const path = require('path');
const subscriptions = require('../../main/app/filters/subscriptions');

const testFilterPath = path.resolve(__dirname, 'test-filter.txt');
describe('Subscriptions tests', () => {
    it('Add custom filter', (done) => {
        const customFilters = subscriptions.loadCustomFilters();
        expect(customFilters).toHaveLength(0);

        subscriptions.updateCustomFilter(testFilterPath, { title: 'Test filter', trusted: true }, (filterId) => {
            expect(filterId).toBe(1000);
            const updatedCustomFilters = subscriptions.loadCustomFilters();
            expect(updatedCustomFilters).toHaveLength(1);

            const testFilterMeta = updatedCustomFilters[0];
            expect(testFilterMeta.filterId).toEqual(filterId);
            expect(testFilterMeta.enabled).toBeTruthy();

            const isTrusted = subscriptions.isTrustedFilter(filterId);
            expect(isTrusted).toBeTruthy();
            done();
        });
    });

    it('Remove custom filter', () => {
        let customFilters = subscriptions.loadCustomFilters();
        expect(customFilters).toHaveLength(1);

        const testFilterMeta = customFilters[0];
        subscriptions.removeCustomFilter(testFilterMeta);
        // remove from cache
        subscriptions.removeFilter(testFilterMeta.filterId);

        customFilters = subscriptions.loadCustomFilters();
        expect(customFilters).toHaveLength(0);
    });
});
