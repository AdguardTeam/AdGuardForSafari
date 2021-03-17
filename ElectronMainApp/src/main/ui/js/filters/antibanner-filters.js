/* global i18n */

const { ipcRenderer } = require('electron');
const Utils = require('../utils/common-utils');
const checkboxUtils = require('../utils/checkbox-utils');
const TopMenu = require('../top-menu');

const ANIMATION_DELAY = 900;

/**
 * Filters block
 *
 * @param options
 * @returns {{render: renderCategoriesAndFilters, updateRulesCountInfo: updateRulesCountInfo,
 * onFilterStateChanged: onFilterStateChanged, onFilterDownloadStarted: onFilterDownloadStarted,
 * onFilterDownloadFinished: onFilterDownloadFinished}}
 * @constructor
 */
/* eslint-disable-next-line no-unused-vars */
const AntiBannerFilters = function (options, contentBlockerInfo, environmentOptions, userSettings) {
    'use strict';

    const loadedFiltersInfo = {
        filters: [],
        categories: [],
        filtersById: {},
        categoriesById: {},
        lastUpdateTime: 0,

        initLoadedFilters(filters, categories) {
            this.filters = filters;
            this.categories = categories;

            const categoriesById = Object.create(null);
            for (let i = 0; i < this.categories.length; i += 1) {
                const category = this.categories[i];
                categoriesById[category.groupId] = category;
            }
            this.categoriesById = categoriesById;

            let lastUpdateTime = 0;
            const filtersById = Object.create(null);
            for (let i = 0; i < this.filters.length; i += 1) {
                const filter = this.filters[i];
                filtersById[filter.filterId] = filter;
                if (filter.lastUpdateTime && filter.lastUpdateTime > lastUpdateTime) {
                    lastUpdateTime = filter.lastUpdateTime;
                }
            }

            this.filtersById = filtersById;
            if (this.lastUpdateTime <= lastUpdateTime) {
                this.lastUpdateTime = lastUpdateTime;
            }
        },

        isEnabled(filterId) {
            const info = this.filtersById[filterId];
            return info && info.enabled;
        },

        updateEnabled(filter, enabled) {
            const info = this.filtersById[filter.filterId];
            if (info) {
                info.enabled = enabled;
            } else {
                this.filters.push(filter);
                this.filtersById[filter.filterId] = filter;
            }
        },

        isCategoryEnabled(categoryId) {
            const category = this.categoriesById[categoryId];
            return category && category.enabled;
        },

        updateCategoryEnabled(category, enabled) {
            const categoryInfo = this.categoriesById[category.groupId];
            if (categoryInfo) {
                categoryInfo.enabled = enabled;
            } else {
                this.categories.push(category);
                this.categoriesById[category.groupId] = category;
            }
        },

        getEnabledFiltersCount() {
            return this.filters.filter((f) => f.enabled && this.isCategoryEnabled(f.groupId)).length;
        },
    };

    // Bind events
    document.addEventListener('change', (e) => {
        if (e.target.getAttribute('name') === 'filterId') {
            toggleFilterState.bind(e.target)();
        } else if (e.target.getAttribute('name') === 'groupId') {
            toggleGroupState.bind(e.target)();
        } else if (e.target.getAttribute('name') === 'userrules') {
            toggleUserrulesState.bind(e.target)();
        } else if (e.target.getAttribute('name') === 'whitelist') {
            toggleAllowlistState.bind(e.target)();
        }
    });
    document.querySelector('#updateAntiBannerFilters')
        .addEventListener('click', updateAntiBannerFilters);

    window.addEventListener('hashchange', clearSearchEvent);

    function getFiltersByGroupId(groupId, filters) {
        return filters.filter((f) => {
            return f.groupId === groupId;
        });
    }

    function countEnabledFilters(filters) {
        let count = 0;
        for (let i = 0; i < filters.length; i += 1) {
            const { filterId } = filters[i];
            if (loadedFiltersInfo.isEnabled(filterId)) {
                count += 1;
            }
        }
        return count;
    }

    function getCategoryElement(groupId) {
        return document.querySelector(`#category${groupId}`);
    }

    function getCategoryCheckbox(groupId) {
        const categoryElement = getCategoryElement(groupId);
        if (!categoryElement) {
            return null;
        }

        return categoryElement.querySelector('input');
    }

    function getFilterElement(filterId) {
        return document.querySelector(`#filter${filterId}`);
    }

    function getFilterCheckbox(filterId) {
        const filterElement = getFilterElement(filterId);
        if (!filterElement) {
            return null;
        }

        return filterElement.querySelector('input');
    }

    function generateFiltersNamesDescription(filters) {
        const namesDisplayCount = 3;
        const enabledFiltersNames = filters
            .filter((filter) => filter.enabled)
            .map((filter) => filter.name);

        let enabledFiltersNamesString;
        const { length } = enabledFiltersNames;
        switch (true) {
            case (length > namesDisplayCount): {
                const displayNamesString = enabledFiltersNames.slice(0, namesDisplayCount).join(', ');
                enabledFiltersNamesString = `${i18n.__(
                    'options_filters_enabled_and_more_divider.message',
                    displayNamesString, length - namesDisplayCount
                )}`;
                break;
            }
            case (length > 1): {
                const lastName = enabledFiltersNames[length - 1];
                const firstNames = enabledFiltersNames.slice(0, length - 1);
                enabledFiltersNamesString = `${i18n.__(
                    'options_filters_enabled_and_divider.message',
                    firstNames.join(', '), lastName
                )}`;
                break;
            }
            case (length === 1): {
                [enabledFiltersNamesString] = enabledFiltersNames;
                break;
            }
            default:
                break;
        }
        enabledFiltersNamesString = length > 0
            ? `${i18n.__('options_filters_enabled.message')} ${enabledFiltersNamesString}`
            : `${i18n.__('options_filters_no_enabled.message')}`;
        return enabledFiltersNamesString;
    }

    function updateCategoryFiltersInfo(groupId) {
        const groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
        const enabledFiltersCount = countEnabledFilters(groupFilters);
        const filtersNamesDescription = generateFiltersNamesDescription(groupFilters);
        const groupFiltersCount = groupFilters.length;

        const element = getCategoryElement(groupId);
        const checkbox = getCategoryCheckbox(groupId);

        if (groupFiltersCount > 0) {
            element.querySelector('.desc').textContent = filtersNamesDescription;
        }

        const isCategoryEnabled = loadedFiltersInfo.isCategoryEnabled(groupId);
        const isCheckboxChecked = typeof isCategoryEnabled === 'undefined'
            ? enabledFiltersCount > 0
            : isCategoryEnabled;
        checkboxUtils.updateCheckbox([checkbox], isCheckboxChecked);
    }

    function getFilterCategoryElement(category) {
        return Utils.htmlToElement(`
                <li id="category${category.groupId}" class="active">
                    <a href="#antibanner${category.groupId}" class="block-type filter-group">
                        <div class="block-type__desc">
                            <div class="block-type__desc-title">${category.groupName}</div>
                            <div class="desc desc--filters"></div>
                        </div>
                    </a>
                    <div class="opt-state combo-opt">
                        <div class="preloader"></div>
                        <input type="checkbox" name="groupId" value="${category.groupId}">
                    </div>
                </li>`);
    }

    function getFilterTemplate(filter, enabled, showDeleteButton) {
        const timeUpdated = new Date(filter.lastUpdateTime || filter.timeUpdated);
        const timeUpdatedText = timeUpdated.toLocaleString(environmentOptions.Prefs.locale);

        let tagDetails = '';
        filter.tagsDetails.forEach((tag) => {
            tagDetails += `<div class="opt-name__tag" data-tooltip='${tag.description}'>#${tag.keyword}</div>`;
        });

        if (filter.trusted) {
            tagDetails += `<div class="opt-name__tag tag-trusted"
                                data-tooltip="${i18n.__('options_filters_filter_trusted_tag_desc.message')}">
                                #${i18n.__('options_filters_filter_trusted_tag.message')}
                           </div>`;
        }

        let deleteButton = '';
        if (showDeleteButton) {
            deleteButton = `<a href="#" filterid="${filter.filterId}" class="remove-custom-filter-button">
                                ${i18n.__('options_filters_custom_remove.message')}
                            </a>`;
        }
        let homeButton = '';
        if (filter.homepage) {
            homeButton = `<a target="_blank" href="${filter.homepage}">`
                + `${i18n.__('options_filters_homepage.message')}</a>`;
        }

        return `
            <li id="filter${filter.filterId}">
                <div class="opts-desc-filter">
                    <div class="opt-name">
                        <div class="title">${filter.name}</div>
                        <div class="desc">
                            ${filter.description}
                            ${homeButton}
                        </div>
                        <div class="opt-name__info">
                            <div class="opt-name__info-labels">
                                <div class="opt-name__info-item filter-version-desc">
                                    ${i18n.__('options_filters_version.message', filter.version)} 
                                </div>
                                <div class="opt-name__info-item last-update-time">
                                    ${i18n.__('options_filters_updated.message', timeUpdatedText)}
                                </div>
                            </div>
                            <div class="opt-name__info-labels opt-name__info-labels--tags tags-container">
                                ${tagDetails}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="opt-state single-opt">
                    <div class="preloader"></div>
                    ${deleteButton}
                    <input
                        type="checkbox"
                        name="filterId"
                        value="${filter.filterId}"
                        ${enabled ? 'checked="checked"' : ''}
                    >
                </div>
            </li>`;
    }

    function getPageTitleTemplate(name) {
        return `
            <div class="page-title antibanner-page-title">
                <a href="#antibanner" class="back-btn"></a>
                ${name}
            </div>`;
    }

    function getEmptyCustomFiltersTemplate(category) {
        return `
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                ${getPageTitleTemplate(category.groupName)}
                <div class="settings-body">
                    <div class="empty-filters">
                        <div class="empty-filters__logo"></div>
                        <div class="empty-filters__desc">
                            ${i18n.__('options_filters_empty_custom_filters.message')}
                        </div>
                        <button class="button button--green empty-filters__btn">
                            ${i18n.__('options_filters_empty_custom_add_button.message')}
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function getFiltersContentElement(category) {
        const { filters } = category;
        const isCustomFilters = category.groupId === 0;

        if (isCustomFilters
            && filters.length === 0) {
            return Utils.htmlToElement(getEmptyCustomFiltersTemplate(category));
        }

        const pageTitleEl = getPageTitleTemplate(category.groupName);

        let filtersList = '';
        for (let i = 0; i < filters.length; i += 1) {
            filtersList += getFilterTemplate(
                filters[i],
                loadedFiltersInfo.isEnabled(filters[i].filterId),
                isCustomFilters
            );
        }

        let addCustomFilterBtn = '';
        if (isCustomFilters) {
            addCustomFilterBtn = '<button class="button button--green empty-filters__btn empty-filters__btn--list">'
                + `${i18n.__('options_filters_empty_custom_add_button.message')}</button>`;
        }

        return Utils.htmlToElement(`
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                <div class="settings-content_page-title">
                    ${pageTitleEl}
                    <div class="filters-search">
                        <input
                            type="text"
                            placeholder="${i18n.__('options_filters_list_search_placeholder.message')}"
                            name="searchFiltersList"
                        />
                    </div>
                </div>
                <div class="settings-body settings-body--search">
                    <ul class="opts-list">
                        ${filtersList}
                    </ul>
                    ${addCustomFilterBtn}
                </div>
            </div>
        `);
    }

    function renderFilterCategory(category) {
        let categoryContentElement = document.querySelector(`#antibanner${category.groupId}`);
        if (categoryContentElement) {
            categoryContentElement.parentNode.removeChild(categoryContentElement);
        }
        let categoryElement = document.querySelector(`#category${category.groupId}`);
        if (categoryElement) {
            categoryElement.parentNode.removeChild(categoryElement);
        }

        categoryElement = getFilterCategoryElement(category);
        document.querySelector('#groupsList').appendChild(categoryElement);
        updateCategoryFiltersInfo(category.groupId);

        categoryContentElement = getFiltersContentElement(category);
        document.querySelector('#antibanner').parentNode.appendChild(categoryContentElement);
    }

    function bindControls() {
        const emptyFiltersAddCustomButton = document.querySelector('.empty-filters__btn');
        if (emptyFiltersAddCustomButton) {
            emptyFiltersAddCustomButton.addEventListener('click', addCustomFilter);
        }

        document.querySelectorAll('.remove-custom-filter-button').forEach((el) => {
            el.addEventListener('click', removeCustomFilter);
        });

        document.querySelectorAll('.tabs-bar .tab').forEach((tab) => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();

                const current = e.currentTarget;
                current.parentNode.querySelectorAll('.tabs-bar .tab').forEach((el) => {
                    el.classList.remove('active');
                });
                current.classList.add('active');

                const { parentNode } = current.parentNode;
                parentNode.querySelector('.opts-list[data-tab="recommended"]').style.display = 'none';
                parentNode.querySelector('.opts-list[data-tab="other"]').style.display = 'none';

                const attr = current.getAttribute('data-tab');
                parentNode.querySelector(`.opts-list[data-tab="${attr}"]`).style.display = 'block';
            });
        });
    }

    const clearSearch = (nodes) => {
        // eslint-disable-next-line no-return-assign
        nodes.forEach((node) => {
            node.style.display = 'none';
        });
    };

    const searchFilters = (searchInput, filters, groups) => {
        let searchString;
        try {
            searchString = Utils.escapeRegExp(searchInput.trim());
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

    const initGroupsSearch = () => {
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
            searchInput.addEventListener('input', Utils.debounce((e) => {
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
            searchInput.addEventListener('input', Utils.debounce((e) => {
                let searchString;
                try {
                    searchString = Utils.escapeRegExp(e.target.value.trim());
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

    function renderCategoriesAndFilters() {
        ipcRenderer.on('getFiltersMetadataResponse', (e, response) => {
            loadedFiltersInfo.initLoadedFilters(response.filters, response.categories);
            updateRulesCountInfo(response.rulesInfo);
            setLastUpdatedTimeText(loadedFiltersInfo.lastUpdateTime);
            Utils.setUserrulesNum(contentBlockerInfo.userRulesNum);
            Utils.setIsAllowlistInverted(!userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE]);
            Utils.setAllowlistInfo(contentBlockerInfo.whitelistedNum);
            setSearchPlaceholder();

            const { categories } = loadedFiltersInfo;
            for (let j = 0; j < categories.length; j += 1) {
                const category = categories[j];
                renderFilterCategory(category);
                initFiltersSearch(category);
            }
            initGroupsSearch();
            bindControls();
            checkboxUtils.toggleCheckbox(document.querySelectorAll('.opt-state input[type=checkbox]'));

            // check document hash
            const { hash } = document.location;
            if (hash && hash.indexOf('#antibanner') === 0) {
                TopMenu.toggleTab();
            }

            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'getContentBlockersMetadata',
            }));
        });

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getFiltersMetadata',
        }));
    }

    function toggleFilterState() {
        const filterId = this.value - 0;
        if (this.checked) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'addAndEnableFilter',
                'filterId': filterId,
            }));
        } else {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'disableFilter',
                'filterId': filterId,
            }));
        }
    }

    function toggleGroupState() {
        const groupId = this.value - 0;
        if (this.checked) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'enableFiltersGroup',
                'groupId': groupId,
            }));
        } else {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'disableFiltersGroup',
                'groupId': groupId,
            }));
        }
    }

    function toggleUserrulesState() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'toggleUserrulesState',
            'enabled': this.checked,
        }));
        userSettings.values[userSettings.names.USERRULES_ENABLED] = this.checked;
    }

    function toggleAllowlistState() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'toggleAllowlistState',
            'enabled': this.checked,
        }));
        userSettings.values[userSettings.names.ALLOWLIST_ENABLED] = this.checked;
    }

    function updateAntiBannerFilters(e) {
        e.preventDefault();
        document.querySelector('#updateAntiBannerFilters').classList.add('loading');

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'checkAntiBannerFiltersUpdate',
        }));
    }

    function addCustomFilter(e) {
        e.preventDefault();

        renderCustomFilterPopup();
    }

    function removeCustomFilter(e) {
        e.preventDefault();
        e.stopPropagation();

        const filterId = e.currentTarget.getAttribute('filterId');
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'removeAntiBannerFilter',
            filterId,
        }));

        const filterElement = getFilterElement(filterId);
        filterElement.parentNode.removeChild(filterElement);
    }

    let customPopupInitialized = false;
    function renderCustomFilterPopup() {
        const POPUP_ACTIVE_CLASS = 'option-popup__step--active';

        function closePopup() {
            document.querySelector('#add-custom-filter-popup').classList.remove('option-popup--active');
        }

        function clearActiveStep() {
            document.querySelector('#add-custom-filter-step-1').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-2').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-3').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-4').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-5').classList.remove(POPUP_ACTIVE_CLASS);

            document.querySelector('#custom-filter-popup-close').style.display = 'block';
        }

        function fillLoadedFilterDetails(filter) {
            const titleInputEl = document.querySelector('#custom-filter-popup-added-title');
            if (filter.name) {
                titleInputEl.value = filter.name;
            } else {
                titleInputEl.value = filter.customUrl;
            }

            document.querySelector('#custom-filter-popup-added-desc').textContent = filter.description;
            document.querySelector('#custom-filter-popup-added-version').textContent = filter.version;
            document.querySelector('#custom-filter-popup-added-rules-count').textContent = filter.rulesCount;
            document.querySelector('#custom-filter-popup-added-homepage').textContent = filter.homepage;
            document.querySelector('#custom-filter-popup-added-homepage').setAttribute('href', filter.homepage);
            document.querySelector('#custom-filter-popup-added-url').textContent = filter.customUrl;
            document.querySelector('#custom-filter-popup-added-url').setAttribute('href', filter.customUrl);
        }

        /* eslint-disable-next-line no-unused-vars */
        function addAndEnableFilter(filterId) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'addAndEnableFilter',
                filterId,
            }));

            closePopup();
        }

        function removeAntiBannerFilter(filterId) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'removeAntiBannerFilter',
                filterId,
            }));
        }

        let onSubscribeClicked;
        let onSubscriptionCancel;
        let onPopupCloseClicked;
        let onSubscribeBackClicked;

        function renderStepOne() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-1').classList.add(POPUP_ACTIVE_CLASS);

            document.querySelector('#custom-filter-popup-url').focus();

            if (onPopupCloseClicked) {
                document.querySelector('#custom-filter-popup-close').removeEventListener('click', onPopupCloseClicked);
            }

            onPopupCloseClicked = () => closePopup();
            document.querySelector('#custom-filter-popup-close').addEventListener('click', onPopupCloseClicked);

            document.querySelector('#custom-filter-popup-cancel').addEventListener('click', onPopupCloseClicked);
        }

        function renderStepTwo() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-2').classList.add(POPUP_ACTIVE_CLASS);
            document.querySelector('#custom-filter-popup-close').style.display = 'none';
        }

        function renderStepThree() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-3').classList.add(POPUP_ACTIVE_CLASS);
        }

        function renderStepFour(filter) {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-4').classList.add(POPUP_ACTIVE_CLASS);
            document.querySelector('#custom-filter-popup-trusted').checked = false;

            fillLoadedFilterDetails(filter);

            if (onSubscribeClicked) {
                document.querySelector('#custom-filter-popup-added-subscribe')
                    .removeEventListener('click', onSubscribeClicked);
            }
            onSubscribeClicked = (e) => {
                e.preventDefault();
                const title = document.querySelector('#custom-filter-popup-added-title').value || '';
                const trustedCheckbox = document.querySelector('#custom-filter-popup-trusted');
                ipcRenderer.send('renderer-to-main', JSON.stringify({
                    'type': 'subscribeToCustomFilter',
                    url: filter.customUrl,
                    title: title.trim(),
                    trusted: trustedCheckbox.checked,
                }));
                renderStepFive();
                ipcRenderer.once('subscribeToCustomFilterSuccessResponse', () => {
                    closePopup();
                });
                ipcRenderer.once('subscribeToCustomFilterErrorResponse', () => {
                    renderStepThree();
                });
            };
            document.querySelector('#custom-filter-popup-added-subscribe')
                .addEventListener('click', onSubscribeClicked);

            if (onSubscriptionCancel) {
                document.querySelector('#custom-filter-popup-remove')
                    .removeEventListener('click', onSubscriptionCancel);
            }
            onSubscriptionCancel = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };
            document.querySelector('#custom-filter-popup-remove')
                .addEventListener('click', onSubscriptionCancel);

            if (onSubscribeBackClicked) {
                document.querySelector('#custom-filter-popup-added-back')
                    .removeEventListener('click', onSubscribeBackClicked);
            }
            onSubscribeBackClicked = () => {
                removeAntiBannerFilter(filter.filterId);
                renderStepOne();
            };
            document.querySelector('#custom-filter-popup-added-back')
                .addEventListener('click', onSubscribeBackClicked);

            if (onPopupCloseClicked) {
                document.querySelector('#custom-filter-popup-close')
                    .removeEventListener('click', onPopupCloseClicked);
            }
            onPopupCloseClicked = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };
            document.querySelector('#custom-filter-popup-close')
                .addEventListener('click', onPopupCloseClicked);
        }

        function renderStepFive() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-5').classList.add(POPUP_ACTIVE_CLASS);
            document.querySelector('#custom-filter-popup-close').style.display = 'none';
        }

        function submitUrl(e) {
            e.preventDefault();

            const url = document.querySelector('#custom-filter-popup-url').value;
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'loadCustomFilterInfo',
                url,
            }));

            ipcRenderer.on('loadCustomFilterInfoResponse', (e, arg) => {
                if (arg) {
                    renderStepFour(arg);
                } else {
                    renderStepThree();
                }
            });

            renderStepTwo();
        }

        function bindEvents() {
            // Step one events
            document.querySelector('#custom-filter-popup-url')
                .addEventListener('keyup', (e) => {
                    e.preventDefault();

                    if (e.keyCode === 13) {
                        submitUrl(e);
                    }
                });
            document.querySelector('.custom-filter-popup-next').addEventListener('click', submitUrl);

            const importCustomFilterFile = document.querySelector('#importCustomFilterFile');
            const customFilterImportBtn = document.querySelector('.custom-filter-import-file');

            customFilterImportBtn.addEventListener('click', (event) => {
                event.preventDefault();
                importCustomFilterFile.click();
            });

            importCustomFilterFile.addEventListener('change', (event) => {
                const file = event.target.files[0];
                const filePath = `file://${file.path}`;
                ipcRenderer.send('renderer-to-main', JSON.stringify({
                    'type': 'loadCustomFilterInfo',
                    url: filePath,
                }));

                ipcRenderer.once('loadCustomFilterInfoResponse', (e, arg) => {
                    importCustomFilterFile.value = '';
                    /* eslint-disable-next-line no-unused-expressions */
                    arg ? renderStepFour(arg) : renderStepThree();
                });
            });

            // Step three events
            document.querySelector('.custom-filter-popup-try-again')
                .addEventListener('click', renderStepOne);
        }

        if (!customPopupInitialized) {
            bindEvents();
            customPopupInitialized = true;
        }

        document.querySelector('#add-custom-filter-popup').classList.add('option-popup--active');
        document.querySelector('#custom-filter-popup-url').value = '';
        renderStepOne();
    }

    function setLastUpdatedTimeText(lastUpdateTime) {
        if (lastUpdateTime && lastUpdateTime >= loadedFiltersInfo.lastUpdateTime) {
            loadedFiltersInfo.lastUpdateTime = lastUpdateTime;

            let updateText = '';
            lastUpdateTime = loadedFiltersInfo.lastUpdateTime;
            if (lastUpdateTime) {
                lastUpdateTime = new Date(lastUpdateTime);
                const options = {
                    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric',
                };
                updateText = lastUpdateTime.toLocaleString(environmentOptions.Prefs.locale, options);
            }

            document.querySelector('#lastUpdateTime').textContent = updateText;
        }
    }

    const setSearchPlaceholder = () => {
        document.querySelector('input[name="searchGroupsList"]')
            .placeholder = i18n.__('options_filters_list_search_placeholder.message');
    };

    /**
     * Checks Safari content blocker rules limit, shows alert message for rules overlimit.
     * It's important to check that limit because of Safari limitations.
     * Content blocker with too many rules won't work at all.
     *
     * @param rulesOverLimit True if loaded rules more than limit
     * @private
     */
    function checkSafariContentBlockerRulesLimit(rulesOverLimit) {
        const tooManyRulesEl = document.querySelector('#too-many-subscriptions-warning');
        if (rulesOverLimit) {
            tooManyRulesEl.style.display = 'block';
        } else {
            tooManyRulesEl.style.display = 'none';
        }
    }

    function updateRulesCountInfo(info) {
        const messageFilters = i18n.__n(
            'options_antibanner_info_filters.message',
            loadedFiltersInfo.getEnabledFiltersCount()
        );
        const messageRules = i18n.__n('options_antibanner_info_rules.message', info.rulesCount || 0);
        const messageAdvancedRules = i18n.__n(
            'options_antibanner_info_adv_rules.message',
            info.advancedBlockingRulesCount || 0
        );

        document.querySelector('#filtersRulesInfo')
            .textContent = `${messageFilters}, ${messageRules}, ${messageAdvancedRules}.`;

        checkSafariContentBlockerRulesLimit(info.rulesOverLimit);
    }

    function onFilterStateChanged(filter) {
        const { filterId } = filter;
        const { enabled } = filter;
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);
        updateFilterMetadata(filter);

        const filterCheckbox = getFilterCheckbox(filterId);
        if (filterCheckbox) {
            checkboxUtils.updateCheckbox([filterCheckbox], enabled);
        }
    }

    function onCategoryStateChanged(category) {
        loadedFiltersInfo.updateCategoryEnabled(category, category.enabled);
        updateCategoryFiltersInfo(category.groupId);
    }

    function onFilterDownloadStarted(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.add('active');

        const filterEl = getFilterElement(filter.filterId);
        if (filterEl) {
            filterEl.querySelector('.preloader').classList.add('active');
        }
    }

    function onFilterDownloadFinished(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.remove('active');
        updateFilterMetadata(filter);
        setLastUpdatedTimeText(filter.lastUpdateTime);
    }

    function onFilterUpdatesFinished() {
        // set timeout to let the update button animation turn around
        setTimeout(() => {
            document.querySelector('#updateAntiBannerFilters').classList.remove('loading');
        }, ANIMATION_DELAY);
    }

    function updateFilterMetadata(filter) {
        const filterEl = getFilterElement(filter.filterId);
        if (filterEl) {
            filterEl.querySelector('.preloader').classList.remove('active');

            const timeUpdated = new Date(filter.lastUpdateTime || filter.timeUpdated);
            const timeUpdatedText = timeUpdated.toLocaleString(environmentOptions.Prefs.locale);

            filterEl.querySelector('.last-update-time')
                .textContent = `${i18n.__('options_filters_updated.message', timeUpdatedText)}`;
            filterEl.querySelector('.filter-version-desc')
                .textContent = `${i18n.__('options_filters_version.message', filter.version)}`;
            filterEl.querySelector('.title').textContent = filter.name;

            const tagTrusted = filterEl.querySelector('.tag-trusted');
            if (!filter.trusted) {
                if (tagTrusted) {
                    filterEl.querySelector('.tags-container').removeChild(tagTrusted);
                }
            } else if (!tagTrusted) {
                const tagTrusted = `<div class="opt-name__tag tag-trusted"
                                        data-tooltip="${i18n.__('options_filters_filter_trusted_tag_desc.message')}">
                                        #${i18n.__('options_filters_filter_trusted_tag.message')}
                                   </div>`;
                filterEl.querySelector('.tags-container').appendChild(Utils.htmlToElement(tagTrusted));
            }
        }
    }

    /**
     * Creates filters info string
     *
     * @param {Array} groupIds array of enabled groups
     * @param {Boolean} userFilterEnabled - is user filter enabled
     * @param {Boolean} allowlistEnabled - is allowlist enabled
     */
    const getFiltersInfo = (groupIds, userFilterEnabled, allowlistEnabled) => {
        if (!groupIds) {
            return null;
        }

        if (loadedFiltersInfo.filters.length === 0) {
            return null;
        }

        let filters = [];
        for (const groupId of groupIds) {
            if (loadedFiltersInfo.isCategoryEnabled(groupId)) {
                const groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
                filters = filters.concat(groupFilters);
            }
        }

        if (userFilterEnabled) {
            filters.push({
                name: i18n.__('userfilter_name.message'),
                enabled: true,
            });
        }

        if (allowlistEnabled) {
            filters.push({
                name: i18n.__('allowlist_name.message'),
                enabled: true,
            });
        }

        return generateFiltersNamesDescription(filters);
    };

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo,
        onFilterStateChanged,
        onCategoryStateChanged,
        onFilterDownloadStarted,
        onFilterDownloadFinished,
        onFilterUpdatesFinished,
        getFiltersInfo,
    };
};

module.exports = AntiBannerFilters;
