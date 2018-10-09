/* global CheckboxUtils, ace, i18n, EventNotifierTypes */

const {ipcRenderer} = require('electron');
const moment = require('moment');

/**
 * Common utils
 *
 * @type {{debounce: Utils.debounce, htmlToElement: Utils.htmlToElement}}
 */
const Utils = {

    /**
     * Debounces function with specified timeout
     *
     * @param func
     * @param wait
     * @returns {Function}
     */
    debounce: function (func, wait) {
        let timeout;
        return function () {
            let context = this, args = arguments;
            let later = function () {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escapes regular expression
     */
    escapeRegExp: (function () {
        const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
        return function (str) {
            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }
            return str.replace(matchOperatorsRe, '\\$&');
        };
    })(),

    /**
     * Creates HTMLElement from string
     *
     * @param {String} html HTML representing a single element
     * @return {Element}
     */
    htmlToElement: function (html) {
        const template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }
};

/**
 * UI checkboxes utils
 *
 * @type {{toggleCheckbox, updateCheckbox}}
 */
const CheckboxUtils = (() => {
    'use strict';

    /**
     * Toggles wrapped elements with checkbox UI
     *
     * @param {Array.<Object>} elements
     */
    const toggleCheckbox = elements => {

        Array.prototype.forEach.call(elements, checkbox => {

            if (checkbox.getAttribute("toggleCheckbox")) {
                //already applied
                return;
            }

            const el = document.createElement('div');
            el.classList.add('toggler');
            checkbox.parentNode.insertBefore(el, checkbox.nextSibling);

            el.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;

                const event = document.createEvent('HTMLEvents');
                event.initEvent('change', true, false);
                checkbox.dispatchEvent(event);
            });

            checkbox.addEventListener('change', () => {
                onClicked(checkbox.checked);
            });

            function onClicked(checked) {
                if (checked) {
                    el.classList.add("active");
                    el.closest("li").classList.add("active");
                } else {
                    el.classList.remove("active");
                    el.closest("li").classList.remove("active");
                }
            }

            checkbox.style.display = 'none';
            onClicked(checkbox.checked);

            checkbox.setAttribute('toggleCheckbox', 'true');
        });
    };

    /**
     * Updates checkbox elements according to checked parameter
     *
     * @param {Array.<Object>} elements
     * @param {boolean} checked
     */
    const updateCheckbox = (elements, checked) => {

        Array.prototype.forEach.call(elements, el => {
            if (checked) {
                el.setAttribute('checked', 'checked');
                el.closest('li').classList.add('active');
            } else {
                el.removeAttribute('checked');
                el.closest('li').classList.remove('active');
            }
        });
    };

    return {
        toggleCheckbox: toggleCheckbox,
        updateCheckbox: updateCheckbox
    };
})();

/**
 * Top menu
 *
 * @type {{init, toggleTab}}
 */
const TopMenu = (function () {
    'use strict';

    const GENERAL_SETTINGS = '#general-settings';
    const ANTIBANNER = '#antibanner';
    const WHITELIST = '#whitelist';

    let prevTabId;
    let onHashUpdatedCallback;

    const toggleTab = function () {

        let tabId = document.location.hash || GENERAL_SETTINGS;
        let tab = document.querySelector(tabId);

        if (tabId.indexOf(ANTIBANNER) === 0 && !tab) {
            // AntiBanner groups and filters are loaded and rendered async
            return;
        }

        if (!tab) {
            tabId = GENERAL_SETTINGS;
            tab = document.querySelector(tabId);
        }

        const antibannerTabs = document.querySelectorAll('[data-tab="' + ANTIBANNER + '"]');

        if (prevTabId) {
            if (prevTabId.indexOf(ANTIBANNER) === 0) {
                antibannerTabs.forEach(function (el) {
                    el.classList.remove('active');
                });
            } else {
                document.querySelector('[data-tab="' + prevTabId + '"]').classList.remove('active');
            }

            document.querySelector(prevTabId).style.display = 'none';
        }

        if (tabId.indexOf(ANTIBANNER) === 0) {
            antibannerTabs.forEach(function (el) {
                el.classList.add('active');
            });
        } else {
            document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
        }

        tab.style.display = 'flex';
        window.scrollTo(0, 0);

        if (tabId === WHITELIST) {
            if (typeof onHashUpdatedCallback === 'function') {
                onHashUpdatedCallback(tabId);
            }
        }

        prevTabId = tabId;
    };

    const init = function (options) {
        onHashUpdatedCallback = options.onHashUpdated;

        window.addEventListener('hashchange', toggleTab);
        document.querySelectorAll('[data-tab]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                document.location.hash = el.getAttribute('data-tab');
            });
        });

        toggleTab();
    };

    return {
        init: init,
        toggleTab: toggleTab
    };

})();

/**
 * Whitelist block
 *
 * @param options
 * @returns {{updateWhiteListDomains: updateWhiteListDomains}}
 * @constructor
 */
const WhiteListFilter = function (options) {
    'use strict';

    let omitRenderEventsCount = 0;

    const editor = ace.edit('whiteListRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

    const applyChangesBtn = document.querySelector('#whiteListFilterApplyChanges');
    const changeDefaultWhiteListModeCheckbox = document.querySelector('#changeDefaultWhiteListMode');

    function loadWhiteListDomains() {
        const response = ipcRenderer.sendSync('renderer-to-main', JSON.stringify({
            'type': 'getWhiteListDomains'
        }));

        editor.setValue(response.content || '');
        applyChangesBtn.style.display = 'none';
    }

    function saveWhiteListDomains(e) {
        e.preventDefault();

        omitRenderEventsCount = 1;

        editor.setReadOnly(true);
        const text = editor.getValue();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'saveWhiteListDomains',
            'content': text
        }));

        editor.setReadOnly(false);
        applyChangesBtn.style.display = 'none';
    }

    function updateWhiteListDomains() {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }

        loadWhiteListDomains();
    }

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'changeDefaultWhiteListMode',
            enabled: !e.currentTarget.checked
        }));

        updateWhiteListDomains();
    }

    applyChangesBtn.addEventListener('click', saveWhiteListDomains);
    changeDefaultWhiteListModeCheckbox.addEventListener('change', changeDefaultWhiteListMode);

    CheckboxUtils.updateCheckbox([changeDefaultWhiteListModeCheckbox], !options.defaultWhiteListMode);

    editor.getSession().addEventListener('change', function () {
        applyChangesBtn.style.display = 'block';
    });

    return {
        updateWhiteListDomains: updateWhiteListDomains
    };
};

/**
 * User filter block
 *
 * @returns {{updateUserFilterRules: updateUserFilterRules}}
 * @constructor
 */
const UserFilter = function () {
    'use strict';

    let omitRenderEventsCount = 0;

    const editor = ace.edit('userRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

    const applyChangesBtn = document.querySelector('#userFilterApplyChanges');

    function loadUserRules() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getUserRules'
        }));

        ipcRenderer.on('getUserRulesResponse', (e, arg) => {
            editor.setValue(arg.content || '');
            applyChangesBtn.style.display = 'none';
        });
    }

    function saveUserRules(e) {
        e.preventDefault();

        omitRenderEventsCount = 1;

        editor.setReadOnly(true);
        const text = editor.getValue();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'saveUserRules',
            'content': text
        }));

        editor.setReadOnly(false);
        applyChangesBtn.style.display = 'none';
    }

    function updateUserFilterRules() {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }

        loadUserRules();
    }

    applyChangesBtn.addEventListener('click', saveUserRules);

    editor.getSession().addEventListener('change', function () {
        applyChangesBtn.style.display = 'block';
    });

    return {
        updateUserFilterRules: updateUserFilterRules
    };
};

/**
 * Filters block
 *
 * @param options
 * @returns {{render: renderCategoriesAndFilters, updateRulesCountInfo: updateRulesCountInfo, onFilterStateChanged: onFilterStateChanged, onFilterDownloadStarted: onFilterDownloadStarted, onFilterDownloadFinished: onFilterDownloadFinished}}
 * @constructor
 */
const AntiBannerFilters = function (options) {
    'use strict';

    const loadedFiltersInfo = {
        filters: [],
        categories: [],
        filtersById: {},
        categoriesById: {},
        lastUpdateTime: 0,

        initLoadedFilters: function (filters, categories) {
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
            for (let i = 0; i < this.filters.length; i++) {
                const filter = this.filters[i];
                filtersById[filter.filterId] = filter;
                if (filter.lastUpdateTime && filter.lastUpdateTime > lastUpdateTime) {
                    lastUpdateTime = filter.lastUpdateTime;
                }
            }

            this.filtersById = filtersById;
            this.lastUpdateTime = lastUpdateTime;
        },

        isEnabled: function (filterId) {
            const info = this.filtersById[filterId];
            return info && info.enabled;
        },

        updateEnabled: function (filter, enabled) {
            const info = this.filtersById[filter.filterId];
            if (info) {
                info.enabled = enabled;
            } else {
                this.filters.push(filter);
                this.filtersById[filter.filterId] = filter;
            }
        },

        isCategoryEnabled: function (categoryId) {
            const category = this.categoriesById[categoryId];
            return category && category.enabled;
        },

        updateCategoryEnabled: function (category, enabled) {
            const categoryInfo = this.categoriesById[category.groupId];
            if (categoryInfo) {
                categoryInfo.enabled = enabled;
            } else {
                this.categories.push(category);
                this.categoriesById[category.groupId] = category;
            }
        },

        getEnabledFiltersCount: function () {
            return this.filters.filter((f) => f.enabled).length;
        }
    };

    // Bind events
    document.addEventListener('change', function (e) {
        if (e.target.getAttribute('name') === 'filterId') {
            toggleFilterState.bind(e.target)();
        } else if (e.target.getAttribute('name') === 'groupId') {
            toggleGroupState.bind(e.target)();
        }
    });
    document.querySelector('#updateAntiBannerFilters').addEventListener('click', updateAntiBannerFilters);

    window.addEventListener('hashchange', clearSearchEvent);

    function getFiltersByGroupId(groupId, filters) {
        return filters.filter(function (f) {
            return f.groupId === groupId;
        });
    }

    function countEnabledFilters(filters) {
        let count = 0;
        for (let i = 0; i < filters.length; i++) {
            const filterId = filters[i].filterId;
            if (loadedFiltersInfo.isEnabled(filterId)) {
                count++;
            }
        }
        return count;
    }

    function getCategoryElement(groupId) {
        return document.querySelector('#category' + groupId);
    }

    function getCategoryCheckbox(groupId) {
        let categoryElement = getCategoryElement(groupId);
        if (!categoryElement) {
            return null;
        }

        return categoryElement.querySelector('input');
    }

    function getFilterElement(filterId) {
        return document.querySelector('#filter' + filterId);
    }

    function getFilterCheckbox(filterId) {
        let filterElement = getFilterElement(filterId);
        if (!filterElement) {
            return null;
        }

        return filterElement.querySelector('input');
    }

    function generateFiltersNamesDescription(filters) {
        const namesDisplayCount = 3;
        const enabledFiltersNames = filters
            .filter(filter => filter.enabled)
            .map(filter => filter.name);

        let enabledFiltersNamesString;
        const length = enabledFiltersNames.length;
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
                enabledFiltersNamesString = enabledFiltersNames[0];
                break;
            }
            default:
                break;
        }
        enabledFiltersNamesString = length > 0 ?
            `${i18n.__('options_filters_enabled.message')} ${enabledFiltersNamesString}` :
            `${i18n.__('options_filters_no_enabled.message')}`;
        return enabledFiltersNamesString;
    }

    function updateCategoryFiltersInfo(groupId) {
        const groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
        const enabledFiltersCount = countEnabledFilters(groupFilters);
        var filtersNamesDescription = generateFiltersNamesDescription(groupFilters);
        var groupFiltersCount = groupFilters.length;

        const element = getCategoryElement(groupId);
        const checkbox = getCategoryCheckbox(groupId);

        if (groupFiltersCount > 0) {
            element.querySelector('.desc').textContent = filtersNamesDescription;
        }

        const isCategoryEnabled = loadedFiltersInfo.isCategoryEnabled(groupId);
        const isCheckboxChecked = typeof isCategoryEnabled === 'undefined' ? enabledFiltersCount > 0 : isCategoryEnabled;
        CheckboxUtils.updateCheckbox([checkbox], isCheckboxChecked);
    }

    function getFilterCategoryElement(category) {
        return Utils.htmlToElement(`
                <li id="category${category.groupId}" class="active">
                    <a href="#antibanner${category.groupId}" class="block-type">
                        <div class="block-type__ico block-type__ico--${category.groupId}"></div>
                        <div class="block-type__desc">
                            <div class="block-type__desc-title">${category.groupName}</div>
                            <div class="desc desc--filters"></div>
                        </div>
                    </a>
                    <div class="opt-state">
                        <div class="preloader"></div>
                        <input type="checkbox" name="groupId" value="${category.groupId}">
                    </div>
                </li>`);
    }

    function getFilterTemplate(filter, enabled, showDeleteButton) {
        const timeUpdated = moment(filter.timeUpdated);
        timeUpdated.locale(environmentOptions.Prefs.locale);
        const timeUpdatedText = timeUpdated.format("D/MM/YYYY HH:mm").toLowerCase();

        let tagDetails = '';
        filter.tagsDetails.forEach(function (tag) {
            tagDetails += `<div class="opt-name__tag" data-tooltip="${tag.description}">#${tag.keyword}</div>`;
        });

        let deleteButton = '';
        if (showDeleteButton) {
            deleteButton = `<a href="#" filterid="${filter.filterId}" class="remove-custom-filter-button">remove</a>`;
        }

        return `
            <li id="filter${filter.filterId}">
                <div class="opts-desc">
                    <div class="opt-name">
                        <div class="title">${filter.name}</div>
                        <div class="desc">${filter.description}</div>
                        <div class="opt-name__info">
                            <div class="opt-name__info-labels">
                                <div class="opt-name__info-item filter-version-desc">version ${filter.version}</div>
                                <div class="opt-name__info-item last-update-time">updated: ${timeUpdatedText}</div>
                            </div>
                            <div class="opt-name__info-labels opt-name__info-labels--tags">
                                ${tagDetails}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="opt-state">
                    <div class="preloader"></div>
                    ${deleteButton}
                    <a class="icon-home" target="_blank" href="${filter.homepage}"></a>
                    <input type="checkbox" name="filterId" value="${filter.filterId}" ${enabled ? 'checked="checked"' : ''}>
                </div>
            </li>`;
    }

    function getPageTitleTemplate(name) {
        return `
            <div class="page-title">
                <a href="#antibanner">
                    <img src="images/arrow-left.svg" class="back">
                </a>
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
                            Sorry, but you don't have any custom filters yet
                        </div>
                        <button class="button button--green empty-filters__btn">
                            Add custom filter
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function getFiltersContentElement(category) {
        let filters = category.filters;
        let isCustomFilters = category.groupId === 0;

        if (isCustomFilters &&
            filters.length === 0) {

            return Utils.htmlToElement(getEmptyCustomFiltersTemplate(category));
        }

        const pageTitleEl = getPageTitleTemplate(category.groupName);

        let filtersList = '';
        for (let i = 0; i < filters.length; i++) {
            filtersList += getFilterTemplate(filters[i], loadedFiltersInfo.isEnabled(filters[i].filterId), isCustomFilters);
        }

        let addCustomFilterBtn = '';
        if (isCustomFilters) {
            addCustomFilterBtn = `<button class="button button--green empty-filters__btn empty-filters__btn--list">Add custom filter</button>`;
        }

        return Utils.htmlToElement(`
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                ${pageTitleEl}
                <div class="settings-body settings-body--search">
                    <div class="filters-search">
                        <input type="text" placeholder="${i18n.__('options_filters_list_search_placeholder.message')}" name="searchFiltersList"/>
                        <div class="icon-search">
                            <img src="images/magnifying-glass.svg" alt="">
                        </div>
                    </div>
                    <ul class="opts-list">
                        ${filtersList}
                    </ul>
                    ${addCustomFilterBtn}
                </div>
            </div>
        `);
    }

    function renderFilterCategory(category) {
        let categoryContentElement = document.querySelector('#antibanner' + category.groupId);
        if (categoryContentElement) {
            categoryContentElement.parentNode.removeChild(categoryContentElement);
        }
        let categoryElement = document.querySelector('#category' + category.groupId);
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

        document.querySelectorAll('.remove-custom-filter-button').forEach(function (el) {
            el.addEventListener('click', removeCustomFilter);
        });

        document.querySelectorAll('.tabs-bar .tab').forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                e.preventDefault();

                const current = e.currentTarget;
                current.parentNode.querySelectorAll('.tabs-bar .tab').forEach(function (el) {
                    el.classList.remove('active');
                });
                current.classList.add('active');

                const parentNode = current.parentNode.parentNode;
                parentNode.querySelector('.opts-list[data-tab="recommended"]').style.display = 'none';
                parentNode.querySelector('.opts-list[data-tab="other"]').style.display = 'none';

                const attr = current.getAttribute('data-tab');
                parentNode.querySelector('.opts-list[data-tab="' + attr + '"]').style.display = 'block';
            });
        });
    }

    function initFiltersSearch(category) {
        const searchInput = document.querySelector(`#antibanner${category.groupId} input[name="searchFiltersList"]`);
        let filters = document.querySelectorAll(`#antibanner${category.groupId} .opts-list li`);
        const SEARCH_DELAY_MS = 250;
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                let searchString;
                try {
                    searchString = Utils.escapeRegExp(e.target.value.trim());
                } catch (err) {
                    console.log(err.message);
                    return;
                }

                if (!searchString) {
                    filters.forEach(filter => {
                        filter.style.display = 'flex';
                    });
                    return;
                }

                filters.forEach(filter => {
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
        let filters = document.querySelectorAll(`#antibanner${groupId} .opts-list li`);
        if (searchInput) {
            searchInput.value = '';
        }

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                filter.style.display = 'flex';
            });
        }
    }

    function renderCategoriesAndFilters() {
        ipcRenderer.on('getFiltersMetadataResponse', (e, response) => {

            loadedFiltersInfo.initLoadedFilters(response.filters, response.categories);
            updateRulesCountInfo(options.rulesInfo);
            setLastUpdatedTimeText(loadedFiltersInfo.lastUpdateTime);

            const categories = loadedFiltersInfo.categories;
            for (let j = 0; j < categories.length; j++) {
                const category = categories[j];
                renderFilterCategory(category);
                initFiltersSearch(category);
            }

            bindControls();
            CheckboxUtils.toggleCheckbox(document.querySelectorAll(".opt-state input[type=checkbox]"));

            // check document hash
            const hash = document.location.hash;
            if (hash && hash.indexOf('#antibanner') === 0) {
                TopMenu.toggleTab();
            }
        });

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getFiltersMetadata'
        }));
    }

    function toggleFilterState() {
        const filterId = this.value - 0;
        if (this.checked) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'addAndEnableFilter',
                'filterId': filterId
            }));
        } else {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'disableFilter',
                'filterId': filterId
            }));
        }
    }

    function toggleGroupState() {
        const groupId = this.value - 0;
        if (this.checked) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'enableFiltersGroup',
                'groupId': groupId
            }));
        } else {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'disableFiltersGroup',
                'groupId': groupId
            }));
        }
    }

    function updateAntiBannerFilters(e) {
        e.preventDefault();
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'checkAntiBannerFiltersUpdate'
        }));

        setLastUpdatedTimeText(Date.now());
    }

    function addCustomFilter(e) {
        e.preventDefault();

        document.location.hash = 'antibanner';
        renderCustomFilterPopup();
    }

    function removeCustomFilter(e) {
        e.preventDefault();

        const filterId = e.currentTarget.getAttribute('filterId');
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'removeAntiBannerFilter',
            filterId: filterId
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

            document.querySelector('#custom-filter-popup-close').style.display = 'block';
        }

        function fillLoadedFilterDetails(filter) {
            document.querySelector('#custom-filter-popup-added-title').textContent = filter.name;
            document.querySelector('#custom-filter-popup-added-desc').textContent = filter.description;
            document.querySelector('#custom-filter-popup-added-version').textContent = filter.version;
            document.querySelector('#custom-filter-popup-added-rules-count').textContent = filter.rulesCount;
            document.querySelector('#custom-filter-popup-added-homepage').textContent = filter.homepage;
            document.querySelector('#custom-filter-popup-added-homepage').setAttribute("href", filter.homepage);
            document.querySelector('#custom-filter-popup-added-url').textContent = filter.customUrl;
            document.querySelector('#custom-filter-popup-added-url').setAttribute("href", filter.customUrl);
        }

        function addAndEnableFilter(filterId) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'addAndEnableFilter',
                filterId: filterId
            }));

            closePopup();
        }

        function removeAntiBannerFilter(filterId) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'removeAntiBannerFilter',
                filterId: filterId
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

            fillLoadedFilterDetails(filter);

            if (onSubscribeClicked) {
                document.querySelector('#custom-filter-popup-added-subscribe').removeEventListener('click', onSubscribeClicked);
            }
            onSubscribeClicked = () => addAndEnableFilter(filter.filterId);
            document.querySelector('#custom-filter-popup-added-subscribe').addEventListener('click', onSubscribeClicked);

            if (onSubscriptionCancel) {
                document.querySelector('#custom-filter-popup-remove').removeEventListener('click', onSubscriptionCancel);
            }
            onSubscriptionCancel = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };
            document.querySelector('#custom-filter-popup-remove').addEventListener('click', onSubscriptionCancel);

            if (onSubscribeBackClicked) {
                document.querySelector('#custom-filter-popup-added-back').removeEventListener('click', onSubscribeBackClicked);
            }
            onSubscribeBackClicked = () => {
                removeAntiBannerFilter(filter.filterId);
                renderStepOne();
            };
            document.querySelector('#custom-filter-popup-added-back').addEventListener('click', onSubscribeBackClicked);

            if (onPopupCloseClicked) {
                document.querySelector('#custom-filter-popup-close').removeEventListener('click', onPopupCloseClicked);
            }
            onPopupCloseClicked = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };
            document.querySelector('#custom-filter-popup-close').addEventListener('click', onPopupCloseClicked);
        }

        function submitUrl(e) {
            e.preventDefault();

            const url = document.querySelector('#custom-filter-popup-url').value;
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'loadCustomFilterInfo',
                url: url
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
            document.querySelector("#custom-filter-popup-url").addEventListener('keyup', function (e) {
                e.preventDefault();

                if (e.keyCode === 13) {
                    submitUrl(e);
                }
            });
            document.querySelector('.custom-filter-popup-next').addEventListener('click', submitUrl);

            // Step three events
            document.querySelector('.custom-filter-popup-try-again').addEventListener('click', renderStepOne);
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

            let updateText = "";
            lastUpdateTime = loadedFiltersInfo.lastUpdateTime;
            if (lastUpdateTime) {
                lastUpdateTime = moment(lastUpdateTime);
                lastUpdateTime.locale(environmentOptions.Prefs.locale);
                updateText = lastUpdateTime.format("D MMMM YYYY HH:mm").toLowerCase();
            }

            document.querySelector('#lastUpdateTime').textContent = updateText;
        }
    }

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
        document.querySelector('#filtersRulesInfo').textContent =
            i18n.__("options_antibanner_info.message", loadedFiltersInfo.getEnabledFiltersCount(), String(info.rulesCount || 0));

        checkSafariContentBlockerRulesLimit(info.rulesOverLimit);
    }

    function onFilterStateChanged(filter) {
        const filterId = filter.filterId;
        const enabled = filter.enabled;
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);

        const filterCheckbox = getFilterCheckbox(filterId);
        if (filterCheckbox) {
            CheckboxUtils.updateCheckbox([filterCheckbox], enabled);
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

        const filterEl = getFilterElement(filter.filterId);
        if (filterEl) {
            filterEl.querySelector('.preloader').classList.remove('active');

            const timeUpdated = moment(filter.lastUpdateTime);
            timeUpdated.locale(environmentOptions.Prefs.locale);
            const timeUpdatedText = timeUpdated.format("D/MM/YYYY HH:mm").toLowerCase();

            filterEl.querySelector('.last-update-time').textContent = `updated:  ${timeUpdatedText}`;
            filterEl.querySelector('.filter-version-desc').textContent = `version: ${filter.version}`;
        }

        setLastUpdatedTimeText(filter.lastUpdateTime);
    }

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo: updateRulesCountInfo,
        onFilterStateChanged: onFilterStateChanged,
        onCategoryStateChanged: onCategoryStateChanged,
        onFilterDownloadStarted: onFilterDownloadStarted,
        onFilterDownloadFinished: onFilterDownloadFinished
    };
};

/**
 * Settings block
 *
 * @returns {{render: render}}
 * @constructor
 */
const Settings = function () {
    'use strict';

    const Checkbox = function (id, property, options) {

        options = options || {};
        const negate = options.negate;
        let hidden = options.hidden;

        const element = document.querySelector(id);
        if (!hidden) {
            element.addEventListener('change', function () {
                ipcRenderer.send('renderer-to-main', JSON.stringify({
                    'type': 'changeUserSetting',
                    'key': property,
                    'value': negate ? !this.checked : this.checked
                }));
            });
        }

        const render = function () {
            if (hidden) {
                element.closest('li').style.display = 'none';
                return;
            }
            let checked = userSettings.values[property];
            if (negate) {
                checked = !checked;
            }

            CheckboxUtils.updateCheckbox([element], checked);
        };

        return {
            render: render
        };
    };

    const checkboxes = [];
    checkboxes.push(new Checkbox('#useOptimizedFilters', userSettings.names.USE_OPTIMIZED_FILTERS));
    checkboxes.push(new Checkbox('#showAppUpdatedNotification', userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, {
        negate: true
    }));

    const allowAcceptableAdsCheckbox = document.querySelector("#allowAcceptableAds");
    allowAcceptableAdsCheckbox.addEventListener('change', function () {
        if (this.checked) {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            }));
        } else {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'disableFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            }));
        }
    });

    const updateAcceptableAdsCheckbox = function (filter) {
        if (filter.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
            CheckboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], filter.enabled);
        }
    };

    const render = function () {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].render();
        }

        updateAcceptableAdsCheckbox({
            filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
            enabled: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters
        });
    };

    return {
        render,
        updateAcceptableAdsCheckbox
    };
};

/**
 * Page controller
 *
 * @constructor
 */
const PageController = function () {
};

PageController.prototype = {

    SUBSCRIPTIONS_LIMIT: 9,

    init: function () {

        this._customizeText();
        this._render();

        CheckboxUtils.toggleCheckbox(document.querySelectorAll(".opt-state input[type=checkbox]"));

        // Initialize top menu
        TopMenu.init({
            onHashUpdated: function (tabId) {
                // Doing nothing
            }.bind(this)
        });

        this._initBoardingScreen();
    },

    _initBoardingScreen: function () {
        let onBoardingScreenEl = document.querySelector('#boarding-screen-placeholder');
        ipcRenderer.on('checkSafariExtensionsResponse', (e, arg) => {
            if (!arg) {
                onBoardingScreenEl.style.display = 'flex';
            } else {
                onBoardingScreenEl.style.display = 'none';
            }
        });

        let openSafariSettingsButton = document.querySelector('#open-safari-extensions-settings-btn');
        openSafariSettingsButton.addEventListener('click', (e) => {
            e.preventDefault();

            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'openSafariExtensionsPrefs'
            }));
        });

        // First extensions check
        this._checkSafariExtensions();

        // Check on every window focus
        window.addEventListener("focus", function (event) {
            this._checkSafariExtensions();
        }.bind(this), false);
    },

    _checkSafariExtensions: function () {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'checkSafariExtensions'
        }));
    },

    _customizeText: function () {
        document.querySelectorAll('a.sp-table-row-info').forEach(function (a) {
            a.classList.add('question');
            a.textContent = '';
        });

        document.querySelectorAll('span.sp-table-row-info').forEach(function (element) {
            const li = element.closest('li');
            element.parentNode.removeChild(element);

            const state = li.querySelector('.opt-state');
            element.classList.add('desc');
            state.insertBefore(element, state.firstChild);
        });
    },

    _render: function () {

        const defaultWhitelistMode = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE];

        if (environmentOptions.Prefs.mobile) {
            document.querySelector('#resetStats').style.display = 'none';
        }

        this.settings = new Settings();
        this.settings.render();

        // Initialize whitelist filter
        this.whiteListFilter = new WhiteListFilter({defaultWhiteListMode: defaultWhitelistMode});
        this.whiteListFilter.updateWhiteListDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters({rulesInfo: contentBlockerInfo});
        this.antiBannerFilters.render();

        document.querySelector('#about-version-placeholder').textContent = i18n.__("options_about_version.message", environmentOptions.appVersion);
    }
};

let userSettings;
let enabledFilters;
let environmentOptions;
let AntiBannerFiltersId;
let contentBlockerInfo;

/**
 * Initializes page
 */
const initPage = function (response) {

    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    environmentOptions = response.environmentOptions;
    contentBlockerInfo = response.contentBlockerInfo;

    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;

    const onDocumentReady = function () {

        const controller = new PageController();
        controller.init();

        ipcRenderer.on('main-to-renderer', (e, arg) => {
            const event = arg.args[0];
            const options = arg.args[1];

            switch (event) {
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    controller.settings.updateAcceptableAdsCheckbox(options);
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    controller.antiBannerFilters.render();
                    break;
                case EventNotifierTypes.FILTER_GROUP_ENABLE_DISABLE:
                    controller.antiBannerFilters.onCategoryStateChanged(options);
                    break;
                case EventNotifierTypes.START_DOWNLOAD_FILTER:
                    controller.antiBannerFilters.onFilterDownloadStarted(options);
                    break;
                case EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER:
                case EventNotifierTypes.ERROR_DOWNLOAD_FILTER:
                    controller.antiBannerFilters.onFilterDownloadFinished(options);
                    break;
                case EventNotifierTypes.UPDATE_USER_FILTER_RULES:
                    controller.userFilter.updateUserFilterRules();
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    controller.whiteListFilter.updateWhiteListDomains();
                    break;
                case EventNotifierTypes.CONTENT_BLOCKER_UPDATED:
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    break;
            }
        });
    };

    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
};

ipcRenderer.on('initializeOptionsPageResponse', (e, arg) => {
    initPage(arg);
});

ipcRenderer.send('renderer-to-main', JSON.stringify({
    'type': 'initializeOptionsPage'
}));