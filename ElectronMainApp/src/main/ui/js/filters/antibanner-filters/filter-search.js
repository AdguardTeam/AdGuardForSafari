const utils = require('../../utils/common-utils');

const clearSearch = (nodes) => {
    // eslint-disable-next-line no-return-assign
    nodes.forEach((node) => {
        node.style.display = 'none';
    });
};

const searchFilters = (searchInput, filters, groups) => {
    let searchString;
    try {
        searchString = utils.escapeRegExp(searchInput.trim());
    } catch (err) {
        /* eslint-disable-next-line no-console */
        console.log(err.message);
        return;
    }

    groups.forEach((group) => {
        group.style.display = searchString ? 'none' : 'flex';
    });

    if (!searchString) {
        return;
    }

    filters.forEach((filter) => {
        const title = filter.querySelector('.title');
        const regexp = new RegExp(searchString, 'gi');
        if (regexp.test(title.textContent)) {
            filter.style.display = 'flex';
        }
    });
};

const initGroupsSearch = (loadedFiltersInfo, getFilterTemplate) => {
    const antibannerList = document.querySelector('#antibanner .opts-list');
    const searchInput = document.querySelector('input[name="searchGroupsList"]');

    const SEARCH_DELAY_MS = 250;

    let filtersTemplate = '';
    loadedFiltersInfo.filters.forEach((filter) => {
        if (!antibannerList.querySelector(`li[id="filter${filter.filterId}"]`)) {
            filtersTemplate += getFilterTemplate(filter, filter.enabled, filter.customUrl);
        }
    });

    const searchFiltersContainer = document.createElement('div');
    searchFiltersContainer.innerHTML = filtersTemplate;
    antibannerList.appendChild(searchFiltersContainer);

    const filters = antibannerList.querySelectorAll('li[id^="filter"]');
    const groups = antibannerList.querySelectorAll('li[id^="category"]');

    clearSearch(filters);

    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce((e) => {
            clearSearch(filters);
            searchFilters(e.target.value, filters, groups);
        }, SEARCH_DELAY_MS));
    }

    if (searchInput.value) {
        searchFilters(searchInput.value, filters, groups);
    }
};

function initFiltersSearch(category) {
    const searchInput = document.querySelector(`#antibanner${category.groupId} input[name="searchFiltersList"]`);
    const filters = document.querySelectorAll(`#antibanner${category.groupId} .opts-list li`);
    const SEARCH_DELAY_MS = 250;
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce((e) => {
            let searchString;
            try {
                searchString = utils.escapeRegExp(e.target.value.trim());
            } catch (err) {
                /* eslint-disable-next-line no-console */
                console.log(err.message);
                return;
            }

            if (!searchString) {
                filters.forEach((filter) => {
                    filter.style.display = 'flex';
                });
                return;
            }

            filters.forEach((filter) => {
                const title = filter.querySelector('.title');
                const regexp = new RegExp(searchString, 'gi');
                if (!regexp.test(title.textContent)) {
                    filter.style.display = 'none';
                } else {
                    filter.style.display = 'flex';
                }
            });
        }, SEARCH_DELAY_MS));
    }
}

/**
 * Function clears search results when user moves from category antibanner page to another page
 *
 * @param {*} on hashchange event
 */
function clearSearchEvent(event) {
    const regex = /#antibanner(\d+)/g;
    const match = regex.exec(event.oldURL);
    if (!match) {
        return;
    }

    const groupId = match[1];
    const searchInput = document.querySelector(`#antibanner${groupId} input[name="searchFiltersList"]`);
    const filters = document.querySelectorAll(`#antibanner${groupId} .opts-list li`);
    if (searchInput) {
        searchInput.value = '';
    }

    if (filters && filters.length > 0) {
        filters.forEach((filter) => {
            filter.style.display = 'flex';
        });
    }
}

module.exports = {
    clearSearch,
    searchFilters,
    initGroupsSearch,
    initFiltersSearch,
    clearSearchEvent,
};
