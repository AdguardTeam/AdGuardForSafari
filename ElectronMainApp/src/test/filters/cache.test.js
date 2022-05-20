const cache = require('../../main/app/filters/cache');
const filtersMetadata = require('../resources/filtersMetadata.json');

jest.mock('../../main/app/app');

describe('Filters, groups and tags cache tests', () => {
    it('Metadata cache test', () => {
        cache.setData(filtersMetadata);

        const filters = cache.getFilters();
        expect(filters).toHaveLength(filtersMetadata.filters.length);
        expect(filters).toStrictEqual(filtersMetadata.filters);

        const groups = cache.getGroups();
        expect(groups).toHaveLength(filtersMetadata.groups.length);
        expect(groups).toStrictEqual(filtersMetadata.groups);

        const tags = cache.getTags();
        expect(tags).toHaveLength(filtersMetadata.tags.length);
        expect(tags).toStrictEqual(filtersMetadata.tags);

        const cacheData = cache.getData();
        expect(cacheData.filters).toStrictEqual(filtersMetadata.filters);
        expect(cacheData.groups).toStrictEqual(filtersMetadata.groups);
        expect(cacheData.tags).toStrictEqual(filtersMetadata.tags);
    });
});
