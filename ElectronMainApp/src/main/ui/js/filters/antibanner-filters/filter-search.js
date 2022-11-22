const { ipcRenderer } = require('electron');

const utils = require('../../utils/common-utils');

const CLEAR_SEARCH_VISIBLE_CLASS = 'clear-search--visible';

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

    const clearSearchButton = document.querySelector('#clearGroupFiltersSearch');

    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce((e) => {
            clearSearch(filters);
            if (searchInput.value) {
                clearSearchButton.classList.add(CLEAR_SEARCH_VISIBLE_CLASS);
            } else {
                clearSearchButton.classList.remove(CLEAR_SEARCH_VISIBLE_CLASS);
            }
            searchFilters(e.target.value, filters, groups);
        }, SEARCH_DELAY_MS));
    }

    if (searchInput.value) {
        searchFilters(searchInput.value, filters, groups);
    }

    clearSearchButton
        .addEventListener('click', (e) => {
            if (searchInput?.value) {
                clearSearch(filters);
                clearSearchEvent(e);
                searchInput.focus();
            }
        });
};

function initFiltersSearch(category, renderCategoryFilters) {
    const searchInput = document.querySelector(`#antibanner${category.groupId} input[name="searchFiltersList"]`);
    if (!searchInput) {
        return;
    }

    // https://github.com/AdguardTeam/AdGuardForSafari/issues/711
    // keep focus on search input if all search symbols has been deleted
    searchInput.focus();

    const filtersContainer = document.querySelector(`#antibanner${category.groupId} .opts-list`);
    const filters = filtersContainer.querySelectorAll('li');

    const SEARCH_DELAY_MS = 250;

    const resetFiltersSearch = () => {
        ipcRenderer.once('getFiltersMetadataResponse', (e, response) => {
            const updatedCategory = response.categories.find((cat) => cat.groupId === category.groupId);
            renderCategoryFilters(updatedCategory);
            const tabId = document.location.hash;
            const tab = document.querySelector(tabId);
            if (!tab) {
                return;
            }
            tab.style.display = 'flex';
            initFiltersSearch(updatedCategory, renderCategoryFilters);
        });
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getFiltersMetadata',
        }));
    };

    const clearSearchButton = document.querySelector(`#antibanner${category.groupId} .clear-filters-search`);

    searchInput.addEventListener('input', utils.debounce((e) => {
        let searchString;
        try {
            searchString = utils.escapeRegExp(e.target.value.trim());
            clearSearchButton.classList.add(CLEAR_SEARCH_VISIBLE_CLASS);
        } catch (err) {
            /* eslint-disable-next-line no-console */
            console.log(err.message);
            return;
        }

        if (!searchString) {
            resetFiltersSearch();
            clearSearchButton.classList.remove(CLEAR_SEARCH_VISIBLE_CLASS);
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

        [...filters]
            .sort((filter) => (filter.className === 'active' ? -1 : 1))
            .forEach((node) => {
                filtersContainer.appendChild(node);
            });
    }, SEARCH_DELAY_MS));

    clearSearchButton
        .addEventListener('click', () => {
            if (searchInput?.value) {
                searchInput.value = '';
                resetFiltersSearch();
                clearSearchButton.classList.remove(CLEAR_SEARCH_VISIBLE_CLASS);
                searchInput.focus();
            }
        });
}

/**
 * Function clears search results when user switches tabs, or moves from category to category
 *
 * @param event hashchange event
 */
function clearSearchEvent(event) {
    const clearGroupSearch = (groupId) => {
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
    };

    const clearGlobalSearch = () => {
        const searchInput = document.querySelector('input[name="searchGroupsList"]');
        const antibannerList = document.querySelector('#antibanner .opts-list');
        const filters = antibannerList.querySelectorAll('li[id^="filter"]');
        const groups = antibannerList.querySelectorAll('li[id^="category"]');

        const clearSearchButton = document.querySelector('#clearGroupFiltersSearch');
        clearSearchButton.classList.remove(CLEAR_SEARCH_VISIBLE_CLASS);
        searchInput.value = '';
        clearSearch(filters);
        searchFilters('', filters, groups);
    };

    const regex = /#antibanner(\d+)/g;
    const match = regex.exec(event.oldURL);
    if (match) {
        clearGroupSearch(match[1]);
    } else {
        clearGlobalSearch();
    }
}

module.exports = {
    clearSearch,
    searchFilters,
    initGroupsSearch,
    initFiltersSearch,
    clearSearchEvent,
};
