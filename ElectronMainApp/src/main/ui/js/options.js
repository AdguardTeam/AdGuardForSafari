/* global CheckboxUtils, ace, i18n, EventNotifierTypes */

const { ipcRenderer } = require('electron');
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
    },

    /**
     * Imports rules from file into editor
     * @param editor
     */
    importFromFileIntoEditor: function importFromFileIntoEditor(editor) {
        return function (event) {
            const fileInput = event.target;
            const reader = new FileReader();
            reader.onload = function (e) {
                const oldRules = editor.getValue();
                const newRules = `${oldRules}\n${e.target.result}`.split('\n');
                const trimmedRules = newRules.map(rule => rule.trim());
                const ruleSet = new Set(trimmedRules);
                const uniqueRules = Array.from(ruleSet).join('\n');
                editor.setValue(uniqueRules.trim());
                fileInput.value = '';
            };
            reader.onerror = function (err) {
                throw new Error(`${i18n.getMessage('options_userfilter_import_rules_error')} ${err.message}`);
            };
            const file = fileInput.files[0];
            if (file) {
                if (file.type !== 'text/plain') {
                    throw new Error(i18n.__('options_popup_import_rules_wrong_file_extension'));
                }
                reader.readAsText(file, 'utf-8');
            }
        };
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
            el.setAttribute('role', 'checkbox');
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
    const CONTENT_BLOCKERS = '#content-blockers';

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
                if (prevTabId !== CONTENT_BLOCKERS) {
                    document.querySelector('[data-tab="' + prevTabId + '"]').classList.remove('active');
                }
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

const Saver = function (options) {
    const HIDE_INDICATOR_TIMEOUT_MS = 2000;
    const DEBOUNCE_TIME = 1000;

    this.indicatorElement = options.indicatorElement;
    this.editor = options.editor;
    this.saveEventType = options.saveEventType;

    const states = {
        SAVING: 'saving',
        SAVED: 'saved',
    };

    const indicatorText = {
        [states.SAVING]: i18n.__('options_editor_indicator_saving.message'),
        [states.SAVED]: i18n.__('options_editor_indicator_saved.message'),
    };

    const setState = (state) => {
        switch (state) {
            case states.SAVING:
                this.indicatorElement.textContent = indicatorText[states.SAVING];
                this.indicatorElement.classList.remove('filter-rules__label--saved');
                break;
            case states.SAVED:
                this.indicatorElement.textContent = indicatorText[states.SAVED];
                this.indicatorElement.classList.add('filter-rules__label--saved');
                setTimeout(() => {
                    this.indicatorElement.textContent = '';
                }, HIDE_INDICATOR_TIMEOUT_MS);
                break;
            default:
                break;
        }
    };

    this.saveData = Utils.debounce(function () {
        const text = this.editor.getValue();
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: this.saveEventType,
            content: text,
        }));
        setState(states.SAVED);
    }.bind(this), DEBOUNCE_TIME);

    const saveData = () => {
        setState(states.SAVING);
        this.saveData();
    }

    return {
        saveData: saveData,
    };
};

/**
 * Function changes editor size while user resizes editor parent node
 * @param editor
 * @param {String} editorId
 */
const handleEditorResize = (editor) => {
    const editorId = editor.container.id;
    const DRAG_TIMEOUT_MS = 100;
    const editorParent = editor.container.parentNode;

    const saveSize = (editorParent) => {
        const { width, height } = editorParent.style;
        if (width && height) {
            localStorage.setItem(editorId, JSON.stringify({ size: { width, height } }));
        }
    };

    const restoreSize = (editorParent) => {
        const dataJson = localStorage.getItem(editorId);
        if (!dataJson) {
            return;
        }
        const { size } = JSON.parse(dataJson);
        const { width, height } = size || {};
        if (width && height) {
            editorParent.style.width = width;
            editorParent.style.height = height;
        }
    };

    // restore size is it was set previously set;
    restoreSize(editorParent);

    const onMouseMove = Utils.debounce(() => {
        editor.resize();
    }, DRAG_TIMEOUT_MS);

    const onMouseUp = () => {
        saveSize(editorParent);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    editorParent.addEventListener('mousedown', (e) => {
        if (e.target === e.currentTarget) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });
};

/**
 * Whitelist block
 *
 * @param options
 * @returns {{updateWhiteListDomains: loadWhiteListDomains}}
 * @constructor
 */
const WhiteListFilter = function (options) {
    'use strict';

    const editorId = 'whiteListRules';
    const editor = ace.edit(editorId);
    handleEditorResize(editor);

    editor.setShowPrintMargin(false);

    editor.$blockScrolling = Infinity;
    editor.session.setMode('ace/mode/adguard');
    editor.setOption('wrap', true);

    const saveIndicatorElement = document.querySelector('#whiteListRulesSaveIndicator');
    const saver = new Saver({
        editor: editor,
        saveEventType: 'saveWhiteListDomains',
        indicatorElement: saveIndicatorElement,
    });

    const changeDefaultWhiteListModeCheckbox = document.querySelector('#changeDefaultWhiteListMode');

    let hasContent = false;
    function loadWhiteListDomains() {
        const response = ipcRenderer.sendSync('renderer-to-main', JSON.stringify({
            'type': 'getWhiteListDomains'
        }));
        hasContent = !!response.content;
        editor.setValue(response.content || '');
    }

    const whiteListEditor = document.querySelector('#whiteListRules > textarea');
    const applyChangesBtn = document.querySelector('#whiteListFilterApplyChanges');

    applyChangesBtn.onclick = (event) => {
        event.preventDefault();
        saver.saveData();
        whiteListEditor.focus();
    };

    editor.commands.addCommand({
        name: 'save',
        bindKey: { win: 'Ctrl-S', 'mac': 'Cmd-S' },
        exec: () => saver.saveData(),
    });

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'changeDefaultWhiteListMode',
            enabled: !e.currentTarget.checked
        }));

        loadWhiteListDomains();
    }

    changeDefaultWhiteListModeCheckbox.addEventListener('change', changeDefaultWhiteListMode);

    CheckboxUtils.updateCheckbox([changeDefaultWhiteListModeCheckbox], !options.defaultWhiteListMode);

    return {
        updateWhiteListDomains: loadWhiteListDomains,
    };
};

/**
 * User filter block
 *
 * @returns {{ updateUserFilterRules: loadUserRules, isUserFilterEmpty }}
 * @constructor
 */
const UserFilter = function () {
    'use strict';

    const editorId = 'userRules';
    const editor = ace.edit(editorId);
    handleEditorResize(editor);

    editor.setShowPrintMargin(false);

    editor.$blockScrolling = Infinity;
    editor.session.setMode('ace/mode/adguard');
    editor.setOption('wrap', true);

    const saveIndicatorElement = document.querySelector('#userRulesSaveIndicator');
    const saver = new Saver({
        editor: editor,
        saveEventType: 'saveUserRules',
        indicatorElement: saveIndicatorElement,
    });

    let hasContent = false;
    function loadUserRules() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getUserRules'
        }));

        ipcRenderer.on('getUserRulesResponse', (e, arg) => {
            hasContent = !!arg.content;
            editor.setValue(arg.content || '');
        });
    }

    const userRulesEditor = document.querySelector('#userRules > textarea');
    const applyChangesBtn = document.querySelector('#userFilterApplyChanges');

    applyChangesBtn.onclick = (event) => {
        event.preventDefault();
        saver.saveData();
        userRulesEditor.focus();
    };

    editor.commands.addCommand({
        name: 'save',
        bindKey: { win: 'Ctrl-S', 'mac': 'Cmd-S' },
        exec: () => saver.saveData(),
    });

    /**
     * returns true is user filter is empty
     */
    const isUserFilterEmpty = () => {
        return !editor.getValue().trim();
    };

    const importUserFiltersInput = document.querySelector('#importUserFilterInput');
    const importUserFiltersBtn = document.querySelector('#userFiltersImport');
    const exportUserFiltersBtn = document.querySelector('#userFiltersExport');

    const session = editor.getSession();

    session.addEventListener('change', () => {
        if (session.getValue().length > 0) {
            exportUserFiltersBtn.classList.remove('disabled');
        } else {
            exportUserFiltersBtn.classList.add('disabled');
        }
    });

    importUserFiltersBtn.addEventListener('click', (event) => {
        event.preventDefault();
        importUserFiltersInput.click();
    });

    importUserFiltersInput.addEventListener('change', (e) => {
        const handleFileInput = Utils.importFromFileIntoEditor(editor);
        try {
            handleFileInput(e);
        } catch (err) {
            // ToDo: handle error
        }
    });

    exportUserFiltersBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const USER_FILTER_HASH = 'uf';
        if (exportUserFiltersBtn.classList.contains('disabled')) {
            return;
        }
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'openExportRulesTab',
            'hash': USER_FILTER_HASH,
        }));
    });

    return {
        updateUserFilterRules: loadUserRules,
        isUserFilterEmpty,
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
            return this.filters.filter((f) => f.enabled && this.isCategoryEnabled(f.groupId)).length;
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
        const timeUpdated = new Date(filter.lastUpdateTime || filter.timeUpdated);
        const timeUpdatedText = timeUpdated.toLocaleString(environmentOptions.Prefs.locale);

        let tagDetails = '';
        filter.tagsDetails.forEach(function (tag) {
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
            homeButton = `<a class="icon-home" target="_blank" href="${filter.homepage}"></a>`;
        }

        return `
            <li id="filter${filter.filterId}">
                <div class="opts-desc-filter">
                    <div class="opt-name">
                        <div class="title">${filter.name}</div>
                        <div class="desc">${filter.description}</div>
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
                <div class="opt-state">
                    <div class="preloader"></div>
                    ${deleteButton}
                    ${homeButton}
                    <input type="checkbox" name="filterId" value="${filter.filterId}" ${enabled ? 'checked="checked"' : ''}>
                </div>
            </li>`;
    }

    function getPageTitleTemplate(name) {
        return `
            <div class="page-title">
                <a href="#antibanner">
                    <img src="images/arrow.svg" class="back">
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
            addCustomFilterBtn = `<button class="button button--green empty-filters__btn empty-filters__btn--list">${i18n.__('options_filters_empty_custom_add_button.message')}</button>`;
        }

        return Utils.htmlToElement(`
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                ${pageTitleEl}
                <div class="settings-body settings-body--search">
                    <div class="filters-search">
                        <div class="icon-search">
                            <img src="images/magnifying-glass.svg" alt="">
                        </div>
                        <input type="text" placeholder="${i18n.__('options_filters_list_search_placeholder.message')}" name="searchFiltersList"/>
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
            updateRulesCountInfo(response.rulesInfo);
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

            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'getContentBlockersMetadata'
            }));
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
        document.querySelector('#updateAntiBannerFilters').classList.add('loading');

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'checkAntiBannerFiltersUpdate'
        }));

        setLastUpdatedTimeText(Date.now());
    }

    function addCustomFilter(e) {
        e.preventDefault();

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
            document.querySelector('#custom-filter-popup-trusted').checked = false;

            fillLoadedFilterDetails(filter);

            if (onSubscribeClicked) {
                document.querySelector('#custom-filter-popup-added-subscribe').removeEventListener('click', onSubscribeClicked);
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
                    url: filePath
                }));

                ipcRenderer.once('loadCustomFilterInfoResponse', (e, arg) => {
                    importCustomFilterFile.value = '';
                    arg ? renderStepFour(arg) : renderStepThree();
                });
            });

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
                lastUpdateTime = new Date(lastUpdateTime);
                const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
                updateText = lastUpdateTime.toLocaleString(environmentOptions.Prefs.locale, options);
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
        const messageFilters = i18n.__n("options_antibanner_info_filters.message", loadedFiltersInfo.getEnabledFiltersCount());
        const messageRules = i18n.__n("options_antibanner_info_rules.message", info.rulesCount || 0);
        const messageAdvancedRules = i18n.__n("options_antibanner_info_adv_rules.message", info.advancedBlockingRulesCount || 0);

        document.querySelector('#filtersRulesInfo').textContent = `${messageFilters} ${messageRules} ${messageAdvancedRules}`;

        checkSafariContentBlockerRulesLimit(info.rulesOverLimit);
    }

    function onFilterStateChanged(filter) {
        const filterId = filter.filterId;
        const enabled = filter.enabled;
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);
        updateFilterMetadata(filter);

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
        updateFilterMetadata(filter);
        setLastUpdatedTimeText(filter.lastUpdateTime);
    }

    function onFilterUpdatesFinished() {
        document.querySelector('#updateAntiBannerFilters').classList.remove('loading');
    }

    function updateFilterMetadata(filter) {
        const filterEl = getFilterElement(filter.filterId);
        if (filterEl) {
            filterEl.querySelector('.preloader').classList.remove('active');

            const timeUpdated = new Date(filter.lastUpdateTime || filter.timeUpdated);
            const timeUpdatedText = timeUpdated.toLocaleString(environmentOptions.Prefs.locale);

            filterEl.querySelector('.last-update-time').textContent = `${i18n.__('options_filters_updated.message', timeUpdatedText)}`;
            filterEl.querySelector('.filter-version-desc').textContent = `${i18n.__('options_filters_version.message', filter.version)}`;
            filterEl.querySelector('.title').textContent = filter.name;

            const tagTrusted = filterEl.querySelector('.tag-trusted');
            if (!filter.trusted) {
                if (tagTrusted) {
                    filterEl.querySelector('.tags-container').removeChild(tagTrusted);
                }
            } else {
                if (!tagTrusted) {
                    const tagTrusted = `<div class="opt-name__tag tag-trusted"
                                        data-tooltip="${i18n.__('options_filters_filter_trusted_tag_desc.message')}">
                                        #${i18n.__('options_filters_filter_trusted_tag.message')}
                                   </div>`;
                    filterEl.querySelector('.tags-container').appendChild(Utils.htmlToElement(tagTrusted));
                }
            }
        }
    }

    /**
     * Creates filters info string
     *
     * @param groupIds [] array of enabled groups
     * @param userFilterEnabled Boolean is user filter enabled
     */
    const getFiltersInfo = (groupIds, userFilterEnabled) => {
        if (!groupIds) {
            return null;
        }

        if (loadedFiltersInfo.filters.length === 0) {
            return null;
        }

        let filters = [];
        for (let groupId of groupIds) {
            if (loadedFiltersInfo.isCategoryEnabled(groupId)) {
                const groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
                filters = filters.concat(groupFilters);
            }
        }

        if (userFilterEnabled) {
            filters.push({
                name: i18n.__("userfilter_name.message"),
                enabled: true
            });
        }

        return generateFiltersNamesDescription(filters);
    };

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo: updateRulesCountInfo,
        onFilterStateChanged: onFilterStateChanged,
        onCategoryStateChanged: onCategoryStateChanged,
        onFilterDownloadStarted: onFilterDownloadStarted,
        onFilterDownloadFinished: onFilterDownloadFinished,
        onFilterUpdatesFinished: onFilterUpdatesFinished,
        getFiltersInfo: getFiltersInfo
    };
};

/**
 * Generate HTML Element SELECT with passed options
 *
 * @param {string} id select ID
 * @param {Array<Object | number | string>} options Array of options
 * @param {string | number} value current select value (set 'select' attribute to option)
 */
const Select = function (id, options, value) {
    if (!id) {
        console.error(`SELECT with id=${id} not found`);
        return;
    }

    let select = document.getElementById(id);
    if (!select) {
        select = document.createElement('select');
    }
    select.setAttribute('id', id);
    select.value = value;

    if (Array.isArray(options)) {
        options
            .map((item) => typeof item === 'object'
                && item.value !== undefined
                && item.name !== undefined
                    ? new Option(item.value, item.name, item.value === value)
                    : new Option(item, item, item === value)
            )
            .forEach(option => select.appendChild(option.render()));
    }

    const render = () => select;

    return { render };
};

/**
 * Generate HTML Element OPTION with passed params
 *
 * @param {string | number} value Select value
 * @param {string | number} name Select name text
 */
const Option = function (value, name, selected) {
    const option = document.createElement('option');
    option.setAttribute('value', value);
    if (selected) {
        option.setAttribute('selected', selected);
    }
    option.innerText = name;

    const render = () => option;

    return { render };
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
            let listener = options.eventListener;
            if (!listener) {
                listener = function () {
                    ipcRenderer.send('renderer-to-main', JSON.stringify({
                        'type': 'changeUserSetting',
                        'key': property,
                        'value': negate ? !this.checked : this.checked
                    }));
                };
            }

            element.addEventListener('change', listener);
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
    checkboxes.push(new Checkbox('#showAppUpdatedNotification', userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, {
        negate: true
    }));

    const toggleAcceptableAdsFilter = Utils.debounce(function (enabled) {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': enabled ? 'addAndEnableFilter' : 'disableFilter',
            filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
        }));
    }, 500);

    const allowAcceptableAdsCheckbox = document.querySelector("#allowAcceptableAds");
    allowAcceptableAdsCheckbox.addEventListener('change', function () {
        toggleAcceptableAdsFilter(this.checked);
    });

    checkboxes.push(new Checkbox('#showTrayIcon', userSettings.names.SHOW_TRAY_ICON));
    checkboxes.push(new Checkbox('#launchAtLogin', userSettings.names.LAUNCH_AT_LOGIN, {
        eventListener: function () {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'changeLaunchAtLogin',
                'value': this.checked
            }));
        }
    }));
    checkboxes.push(new Checkbox('#verboseLogging', userSettings.names.VERBOSE_LOGGING));
    checkboxes.push(new Checkbox('#enableHardwareAcceleration', userSettings.names.DISABLE_HARDWARE_ACCELERATION, {
        negate: true
    }));

    const initUpdateFiltersPeriodSelect = () => {
        const periods = [48, 24, 12, 6, 1]; // in hours
        const periodSelectOptions = periods.map(item => ({
            value: item,
            name: i18n.__n('options_filters_update_period_number.message', item)
        }));
        periodSelectOptions.push({
            value: -1,
            name: i18n.__('options_filters_period_not_update.message')
        });

        const currentPeriodValue = userSettings.values[userSettings.names.UPDATE_FILTERS_PERIOD];
        const periodSelect = document.getElementById('filterUpdatePeriod');
        periodSelect && periodSelect.addEventListener('change', (event) => {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                type: 'changeUpdateFiltersPeriod',
                value: parseInt(event.target.value)
            }));
        });

        return new Select('filterUpdatePeriod', periodSelectOptions, currentPeriodValue);
    };
    const periodSelect = initUpdateFiltersPeriodSelect();

    const updateAcceptableAdsCheckbox = Utils.debounce(function (filter) {
        if (filter.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
            CheckboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], filter.enabled);
        }
    }, 500);

    const launchAtLoginCheckbox = document.querySelector("#launchAtLogin");
    const updateLaunchAtLoginCheckbox = function (enabled) {
        CheckboxUtils.updateCheckbox([launchAtLoginCheckbox], enabled);
    };

    const enableProtectionNotification = document.querySelector('#enableProtectionNotification');
    const showProtectionStatusWarning = function (protectionEnabled) {
        if (protectionEnabled) {
            enableProtectionNotification.style.display = 'none';
        } else {
            enableProtectionNotification.style.display = 'flex';
        }
    };

    const notificationEnableProtectionLink = document.getElementById('notificationEnableProtectionLink');
    notificationEnableProtectionLink && notificationEnableProtectionLink.addEventListener('click', (e) => {
        e.preventDefault();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: 'enableProtection'
        }));
    });

    const render = function () {
        periodSelect.render();

        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].render();
        }

        updateAcceptableAdsCheckbox({
            filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
            enabled: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters
        });

        showProtectionStatusWarning(isProtectionRunning);
    };

    const updateContentBlockersDescription = (info) => {
        const cbDescription = document.getElementById('options_content_blockers_desc_container');
        if (info.enabledContentBlockersCount === 0) {
            cbDescription.textContent = i18n.__("options_content_blockers_disabled_desc.message");
        } else {
            cbDescription.textContent = i18n.__n("options_content_blockers_desc.message", info.enabledContentBlockersCount);
        }
    };

    return {
        render,
        updateAcceptableAdsCheckbox,
        updateLaunchAtLoginCheckbox,
        showProtectionStatusWarning,
        updateContentBlockersDescription,
    };
};

/**
 * Content blockers tab
 *
 * @returns {*}
 * @constructor
 */
const ContentBlockersScreen = function (antiBannerFilters, userFilter) {
    'use strict';

    /**
     * Elements to extension bundles dictionary
     *
     * @type {{*}}
     */
    const extensionElements = {
        "com.adguard.safari.AdGuard.BlockerExtension": "cb_general",
        "com.adguard.safari.AdGuard.BlockerPrivacy": "cb_privacy",
        "com.adguard.safari.AdGuard.BlockerSocial": "cb_social",
        "com.adguard.safari.AdGuard.BlockerSecurity": "cb_security",
        "com.adguard.safari.AdGuard.BlockerOther": "cb_other",
        "com.adguard.safari.AdGuard.BlockerCustom": "cb_custom"
    };

    /**
     * Extension element for bundle identifier
     *
     * @param bundleId
     * @return {*}
     */
    const getExtensionElement = (bundleId) => {
        const elementId = extensionElements[bundleId];
        if (elementId) {
            return document.getElementById(elementId);
        }

        return null;
    };

    /**
     * Updates content blockers info
     *
     * @param info
     */
    const updateContentBlockers = (info) => {
        for (let extensionId in info.extensions) {
            const state = info.extensions[extensionId];

            const element = getExtensionElement(extensionId);
            if (element) {
                const icon = element.querySelector('.extension-block-ico');
                const warning = element.querySelector('.cb_warning');
                const rulesCount = element.querySelector('.cb_rules_count');

                icon.classList.remove("block-type__ico-info--load");

                icon.classList.add(state ? "block-type__ico-info--check" : "block-type__ico-info--warning");
                warning.style.display = state ? 'none' : 'flex';
                warning.textContent = i18n.__("options_cb_disabled_warning.message");

                rulesCount.style.display = state ? 'flex' : 'none';
            }
        }
    };

    /**
     * Updates extension rules count
     *
     * @param bundleId
     * @param info
     * @param filtersInfo
     */
    const updateExtensionState = (bundleId, info, filtersInfo) => {
        const element = getExtensionElement(bundleId);
        if (element) {
            if (info) {
                const rulesInfoElement = element.querySelector('.cb_rules_count');
                const icon = element.querySelector('.extension-block-ico');

                if (info.overlimit) {
                    icon.classList.add("block-type__ico-info--overlimit-warning");

                    let textContent = i18n.__("options_cb_rules_overlimit_info.message", info.rulesCount);
                    textContent = textContent.replace('$2', info.rulesCount - 50000);

                    //rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.add('cb_overlimit_warning');
                    rulesInfoElement.innerHTML = textContent;
                } else if (info.hasError) {
                    icon.classList.add("block-type__ico-info--overlimit-warning");

                    //rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.add('cb_overlimit_warning');
                    rulesInfoElement.textContent = i18n.__("options_cb_compilation_warning.message");
                } else {
                    icon.classList.remove("block-type__ico-info--overlimit-warning");

                    //rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.remove('cb_overlimit_warning');
                    rulesInfoElement.textContent = i18n.__n("options_cb_rules_info.message", info.rulesCount);
                }

            }

            if (filtersInfo) {
                const filtersInfoElement = element.querySelector('.cb_filters_info');
                filtersInfoElement.textContent = filtersInfo;
            }
        }
    };

    /**
     * Sets loading state for extensions
     */
    const setLoading = () => {
        const extensionsIcons = document.querySelectorAll('.extension-block-ico');
        extensionsIcons.forEach((ext) => {
            ext.classList.remove("block-type__ico-info--warning");
            ext.classList.remove("block-type__ico-info--check");

            ext.classList.add("block-type__ico-info--load");
        });
    };

    /**
     * Initialize
     *
     */
    const init = () => {
        ipcRenderer.on('getContentBlockersMetadataResponse', (e, response) => {
            const userFilterEnabled = !userFilter.isUserFilterEmpty();
            for (let extension of response) {
                const filtersInfo = antiBannerFilters.getFiltersInfo(extension.groupIds, userFilterEnabled);
                updateExtensionState(extension.bundleId, extension.rulesInfo, filtersInfo);
            }
        });
    };

    return {
        updateContentBlockers,
        setLoading,
        updateExtensionState,
        init
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

        this._preventDragAndDrop();
        this._customizeText();
        this._render();

        CheckboxUtils.toggleCheckbox(document.querySelectorAll(".opt-state input[type=checkbox]"));

        // Initialize top menu
        TopMenu.init({
            onHashUpdated: function (tabId) {
                // Doing nothing
            }.bind(this)
        });

        this.aboutUpdatesBlock = document.getElementById('about-updates');
        this.aboutUpdatesRelaunch = document.getElementById('about-updates-relaunch');

        this._initBoardingScreen();
        this._initUpdatesBlock();
    },

    _initUpdatesBlock: function () {
        if (!environmentOptions.updatesPermitted) {
            return;
        }

        this.aboutUpdatesBlock.style.display = 'block';
        this.aboutUpdatesRelaunch.addEventListener('click', (e) => {
            e.preventDefault();
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                type: 'updateRelaunch'
            }));
        });

        window.addEventListener('hashchange', () => {
            if (document.location.hash === '#about') {
                ipcRenderer.send('renderer-to-main', JSON.stringify({
                    type: 'checkUpdates'
                }));
            }
        });
    },

    _initBoardingScreen: function () {
        const hideExtensionsNotificationKey = 'hide-extensions-notification';

        let body = document.querySelector('body');
        let onBoardingScreenEl = body.querySelector('#boarding-screen-placeholder');
        const enableExtensionsNotification = document.getElementById('enableExtensionsNotification');
        const enableCbExtensionsNotification = document.getElementById('enableCbExtensionsNotification');

        let self = this;
        ipcRenderer.on('getSafariExtensionsStateResponse', (e, arg) => {
            // const allContentBlockersDisabled = arg.allContentBlockersDisabled;
            const contentBlockersEnabled = arg.contentBlockersEnabled;
            const minorExtensionsEnabled = arg.minorExtensionsEnabled;

            body.style.overflow = !allContentBlockersDisabled ? 'auto' : 'hidden';
            onBoardingScreenEl.style.display = !allContentBlockersDisabled ? 'none' : 'flex';

            const hideExtensionsNotification = window.localStorage.getItem(hideExtensionsNotificationKey) === "true";
            const extensionsFlag = contentBlockersEnabled && minorExtensionsEnabled;
            if (extensionsFlag) {
                //extensions config had been changed - reset hide-extensions "cookie"
                window.localStorage.setItem(hideExtensionsNotificationKey, false);
            }

            const shouldHide = hideExtensionsNotification || extensionsFlag;

            enableExtensionsNotification.style.display = shouldHide ? 'none' : 'flex';
            enableCbExtensionsNotification.style.display = contentBlockersEnabled ? 'none' : 'flex';

            self.contentBlockers.updateContentBlockers(arg);
            self.settings.updateContentBlockersDescription(arg);
        });

        const openSafariSettingsButtons = document.querySelectorAll('.open-safari-extensions-settings-btn');
        openSafariSettingsButtons.forEach((but) => {
             but.addEventListener('click', (e) => {
                 e.preventDefault();
                 this._openSafariExtensionsPrefs();
             });
        });

        const enableExtensionsNotificationClose = document.getElementById('enableExtensionsNotificationClose');
        enableExtensionsNotificationClose.addEventListener('click', (e) => {
            e.preventDefault();
            enableExtensionsNotification.style.display = 'none';

            window.localStorage.setItem(hideExtensionsNotificationKey, true);
        });

        this.checkSafariExtensions();
        window.addEventListener("focus", () => this.checkSafariExtensions());
    },

    checkSafariExtensions: function() {
        this.contentBlockers.setLoading();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getSafariExtensionsState'
        }));
    },

    _openSafariExtensionsPrefs: function() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'openSafariExtensionsPrefs'
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
        this.whiteListFilter = new WhiteListFilter({ defaultWhiteListMode: defaultWhitelistMode });
        this.whiteListFilter.updateWhiteListDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters({ rulesInfo: contentBlockerInfo });
        this.antiBannerFilters.render();

        // Initialize Content blockers
        this.contentBlockers = new ContentBlockersScreen(this.antiBannerFilters, this.userFilter);
        this.contentBlockers.init();

        document.querySelector('#about-version-placeholder').textContent = i18n.__("options_about_version.message", environmentOptions.appVersion);
    },

    _preventDragAndDrop: function () {
        document.addEventListener('dragover', function (event) {
            event.preventDefault();
            return false;
        }, false);

        document.addEventListener('drop', function (event) {
            event.preventDefault();
            return false;
        }, false);
    },

    onAppUpdateFound: function () {
        this.aboutUpdatesBlock.innerText = i18n.__("options_about_updating.message");
    },

    onAppUpdateNotFound: function () {
        this.aboutUpdatesBlock.classList.remove('about-updates--rotate');
        this.aboutUpdatesBlock.classList.add('about-updates--hidden');
        this.aboutUpdatesBlock.innerText = i18n.__("options_about_updates_not_found.message");
    },

    onAppUpdateDownloaded: function () {
        this.aboutUpdatesBlock.classList.remove('about-updates--rotate');
        this.aboutUpdatesBlock.classList.add('about-updates--hidden');
        this.aboutUpdatesBlock.innerText = i18n.__("options_about_update_downloaded.message");

        this.aboutUpdatesRelaunch.classList.remove('about-btn--hidden');
    }
};

let userSettings;
let enabledFilters;
let environmentOptions;
let AntiBannerFiltersId;
let contentBlockerInfo;
let isProtectionRunning;

/**
 * Initializes page
 */
const initPage = function (response) {

    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    environmentOptions = response.environmentOptions;
    contentBlockerInfo = response.contentBlockerInfo;
    isProtectionRunning = response.isProtectionRunning;

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
                    controller.contentBlockers.setLoading();
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    controller.antiBannerFilters.render();
                    break;
                case EventNotifierTypes.FILTER_GROUP_ENABLE_DISABLE:
                    controller.antiBannerFilters.onCategoryStateChanged(options);
                    controller.contentBlockers.setLoading();
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
                    controller.contentBlockers.setLoading();
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    controller.whiteListFilter.updateWhiteListDomains();
                    controller.contentBlockers.setLoading();
                    break;
                case EventNotifierTypes.CONTENT_BLOCKER_UPDATED:
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    controller.checkSafariExtensions();
                    break;
                case EventNotifierTypes.CONTENT_BLOCKER_EXTENSION_UPDATED:
                    const userFilterEnabled = !controller.userFilter.isUserFilterEmpty();
                    const filtersInfo = controller.antiBannerFilters.getFiltersInfo(options.filterGroups, userFilterEnabled);
                    controller.contentBlockers.updateExtensionState(options.bundleId, options, filtersInfo);
                    break;
                case EventNotifierTypes.SHOW_OPTIONS_GENERAL_TAB:
                    window.location.hash = 'general-settings';
                    break;
                case EventNotifierTypes.SHOW_OPTIONS_FILTERS_TAB:
                    window.location.hash = 'antibanner';
                    break;
                case EventNotifierTypes.SHOW_OPTIONS_USER_FILTER_TAB:
                    window.location.hash = 'userfilter';
                    break;
                case EventNotifierTypes.SHOW_OPTIONS_ABOUT_TAB:
                    window.location.hash = 'about';
                    break;
                case EventNotifierTypes.LAUNCH_AT_LOGIN_UPDATED:
                    controller.settings.updateLaunchAtLoginCheckbox(options);
                    break;
                case EventNotifierTypes.PROTECTION_STATUS_CHANGED:
                    controller.settings.showProtectionStatusWarning(options);
                    break;
                case EventNotifierTypes.APPLICATION_UPDATE_FOUND:
                    controller.onAppUpdateFound(options);
                    break;
                case EventNotifierTypes.APPLICATION_UPDATE_NOT_FOUND:
                    controller.onAppUpdateNotFound(options);
                    break;
                case EventNotifierTypes.APPLICATION_UPDATE_DOWNLOADED:
                    controller.onAppUpdateDownloaded(options);
                    break;
                case EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP:
                    controller.antiBannerFilters.onFilterUpdatesFinished();
                    break;
            }
        });

        // Hide loading content
        document.getElementById('preloaderContainer').style.display = 'none';
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
