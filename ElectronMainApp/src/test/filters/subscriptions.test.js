const fs = require('fs-extra');
const path = require('path');
const subscriptions = require('../../main/app/filters/subscriptions');
const cache = require('../../main/app/filters/cache');

// copy filters to use in test environment
fs.copySync(
    path.resolve(__dirname, '../../../filters'),
    path.resolve(__dirname, '../../../node_modules/@jest-runner/electron/build/filters')
);

jest.mock('../../main/app/app');

const testFilter = {
    filterId: 1100,
    groupId: 0,
    name: 'Test filter',
    description: 'Lorem ipsum',
    version: '0.0.0.3',
    displayNumber: 1,
    timeUpdated: '1778723998000',
    expires: 345600,
    subscriptionUrl: 'https://filters.adtidy.org/extension/safari/filters/14_optimized.txt',
    languages: ['en'],
    tags: [ 5, 10, 11 ],
}

describe('Subscriptions tests', () => {
    it('Init tests', (done) => {
        subscriptions.init(() => {
            const filters = cache.getFilters();
            // console.log(filters);
            expect(true).toBeTruthy();
            expect(filters.length).toBeGreaterThan(50);
            expect(filters[0]).toHaveProperty('filterId');
            expect(filters[0].filterId).toBeDefined();
            expect(filters[0]).toHaveProperty('groupId');
            expect(filters[0].groupId).toBeDefined();

            done();
        });
    });

    it('Create subscription filter from JSON tests', () => {
        const filter = subscriptions.createSubscriptionFilterFromJSON(testFilter);
        expect(filter).toBeDefined();
        expect(typeof filter).toBe('object');
        expect(filter.filterId).toEqual(testFilter.filterId);
        expect(filter.groupId).toEqual(testFilter.groupId);
        expect(filter.version).toEqual(testFilter.version);
        expect(filter.timeUpdated).not.toEqual(testFilter.timeUpdated);
        expect(filter.subscriptionUrl).toEqual(testFilter.subscriptionUrl);
    });
});
