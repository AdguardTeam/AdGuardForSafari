const cache = require('../../main/app/filters/cache');
const serviceClient = require('../../main/app/filters/service-client');

jest.mock('../../main/app/app');

describe('Filters, groups and tags cache tests', () => {
    it('Metadata cache test', (done) => {
        serviceClient.loadRemoteFiltersMetadata((metadata) => {
            cache.setData(metadata);

            const filters = cache.getFilters();
            expect(filters).toHaveLength(metadata.filters.length);
            expect(filters).toStrictEqual(metadata.filters);

            const groups = cache.getGroups();
            expect(groups).toHaveLength(metadata.groups.length);
            expect(groups).toStrictEqual(metadata.groups);

            const tags = cache.getTags();
            expect(tags).toHaveLength(metadata.tags.length);
            expect(tags).toStrictEqual(metadata.tags);

            const cacheData = cache.getData();
            expect(cacheData.filters).toStrictEqual(metadata.filters);
            expect(cacheData.groups).toStrictEqual(metadata.groups);
            expect(cacheData.tags).toStrictEqual(metadata.tags);

            done();
        });
    });
});
