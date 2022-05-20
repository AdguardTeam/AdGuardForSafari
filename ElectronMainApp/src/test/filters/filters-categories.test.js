const cache = require('../../main/app/filters/cache');
const filtersCategories = require('../../main/app/filters/filters-categories');
const filtersMetadata = require('../resources/filtersMetadata.json');

jest.mock('../../utils/app-pack');

describe('Filters categories tests', () => {
    it('Categories metadata test', () => {
        cache.setData(filtersMetadata);

        const data = filtersCategories.getFiltersMetadata();
        expect(data).toBeDefined();
        expect(data).toHaveProperty('categories');
        expect(data.categories).toHaveLength(7);
        expect(data.categories[0]).toHaveProperty('groupId');

        const filters = filtersCategories.getFiltersByGroupId(1);
        expect(filters).toBeDefined();
        expect(filters).toHaveLength(3);
        expect(filters[0]).toHaveProperty('filterId');
    });
});
