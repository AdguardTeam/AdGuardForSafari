const path = require('path');
const subscriptions = require('../main/app/filters/subscriptions');
const customFilterFilename = 'adg-custom-filter.txt';
const testFilterUrl = path.resolve(__dirname, 'filters', customFilterFilename);
const testFilterOptions = {
    trusted: true,
    title: 'Test custom filter',
};

describe('Custom filters management tests', () => {
    it('Add new custom filter and check is it trusted', () => {
        subscriptions.updateCustomFilter(
            testFilterUrl,
            testFilterOptions,
            (filterId) => {
                expect(filterId).toBeGreaterThanOrEqual(1000);
                const isTrusted = subscriptions.isTrustedFilter(filterId);
                expect(isTrusted).toBeTruthy();
            })
        ;
    });

    it('Load custom filters', () => {
        const customFilters = subscriptions.loadCustomFilters();
        expect(customFilters[0]).toHaveProperty('filterId', 1000);
    });

    it('Get custom filter metadata by url', () => {
        subscriptions.getCustomFilterInfo(
            testFilterUrl,
            testFilterOptions,
            (filter) => {
                expect(filter.customUrl).toEqual(testFilterUrl);
            })
        ;
    });
});
