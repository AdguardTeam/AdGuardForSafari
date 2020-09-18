const cache = require('../../main/app/filters/cache');
const filtersCategories = require('../../main/app/filters/filters-categories');
const serviceClient = require('../../main/app/filters/service-client');

jest.mock('../../main/app/app');

describe('Filters categories tests', () => {
    it('Categories metadata test', (done) => {
        serviceClient.loadRemoteFiltersMetadata((metadata) => {
            cache.setData(metadata);

            const data = filtersCategories.getFiltersMetadata();
            expect(data).toBeDefined();
            expect(data).toHaveProperty('categories');
            expect(data.categories).toHaveLength(7);
            expect(data.categories[0]).toHaveProperty('groupId');

            const filters = filtersCategories.getFiltersByGroupId(1);
            expect(filters).toBeDefined();
            expect(filters).toHaveLength(4);
            expect(filters[0]).toHaveProperty('filterId');

            done();
        });
    });
});
