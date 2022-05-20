const path = require('path');

const serviceClient = require('../../main/app/filters/service-client');
const filtersMetadata = require('../resources/filtersMetadata.json');

const testFilterPath = path.resolve(__dirname, '../resources', 'test-filter.txt');

jest.mock('../../main/app/app');

jest.spyOn(serviceClient, 'loadRemoteFiltersMetadata').mockImplementation((callback) => {
    callback(filtersMetadata);
});

describe('Service client tests', () => {
    it('Download rules by path', (done) => {
        serviceClient.loadFilterRulesBySubscriptionUrl(testFilterPath, (lines) => {
            try {
                expect(lines).toHaveLength(8);
                expect(lines[0]).toBe('! Title: Test custom filter');
                done();
            } catch (error) {
                done(error);
            }
        });
    });

    it('Load filters metadata by id', (done) => {
        serviceClient.loadFiltersMetadata([4, 5, 6], (metadata) => {
            try {
                expect(metadata).toHaveLength(3);
                expect(metadata[0].filterId).toBe(4);
                expect(metadata[0].name).toBe('AdGuard Social Media filter');
                expect(metadata[0].description).toBeDefined();
                expect(metadata[0].timeAdded).toBeDefined();
                expect(metadata[0].displayNumber).toBeDefined();
                expect(metadata[0].groupId).toBeDefined();
                expect(metadata[0].subscriptionUrl).toBeDefined();
                expect(metadata[0].trustLevel).toBeDefined();
                expect(metadata[0].version).toBeDefined();
                expect(metadata[0].timeUpdated).toBeDefined();
                expect(metadata[0].tags).toBeDefined();
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
