class FiltersCache {
    constructor() {
        this.tags = [];
        this.groups = [];
        this.groupsMap = {};
        this.filters = [];
        this.filtersMap = {};
    }
}

const filtersCache = new FiltersCache();

module.exports = filtersCache;
