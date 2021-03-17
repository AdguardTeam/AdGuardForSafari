/* global i18n, EventNotifierTypes */

const { ipcRenderer } = require('electron');

// eslint-disable-next-line import/no-unresolved
const WhiteListFilter = require('./js/filters/whitelist-filter');
// eslint-disable-next-line import/no-unresolved
const UserFilter = require('./js/filters/user-filter');
// eslint-disable-next-line import/no-unresolved
const Utils = require('./js/utils/common-utils');
// eslint-disable-next-line import/no-unresolved
const checkboxUtils = require('./js/utils/checkbox-utils');
// eslint-disable-next-line import/no-unresolved
const TopMenu = require('./js/top-menu');
// eslint-disable-next-line import/no-unresolved
const ContentBlockersScreen = require('./js/content-blockers');
// eslint-disable-next-line import/no-unresolved
const AntiBannerFilters = require('./js/filters/antibanner-filters');

/**
 * Generate HTML Element SELECT with passed options
 *
 * @param {string} id select ID
 * @param {Array<Object | number | string>} options Array of options
 * @param {string | number} value current select value (set 'select' attribute to option)
 */
const Select = function (id, options, value) {
    if (!id) {
        /* eslint-disable-next-line no-console */
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
            .map((item) => (typeof item === 'object'
            && item.value !== undefined
            && item.name !== undefined
                ? new Option(item.value, item.name, item.value === value)
                : new Option(item, item, item === value)))
            .forEach((option) => select.appendChild(option.render()));
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
        const { negate } = options;
        const { hidden } = options;

        const element = document.querySelector(id);
        if (!hidden) {
            let listener = options.eventListener;
            if (!listener) {
                listener = function () {
                    ipcRenderer.send('renderer-to-main', JSON.stringify({
                        'type': 'changeUserSetting',
                        'key': property,
                        'value': negate ? !this.checked : this.checked,
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

            checkboxUtils.updateCheckbox([element], checked);
        };

        return {
            render,
        };
    };
    const checkboxes = [];
    checkboxes.push(new Checkbox(
        '#showAppUpdatedNotification',
        userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION,
        { negate: true }
    ));

    const toggleAcceptableAdsFilter = Utils.debounce((enabled) => {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': enabled ? 'addAndEnableFilter' : 'disableFilter',
            filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
        }));
    }, 500);

    const allowAcceptableAdsCheckbox = document.querySelector('#allowAcceptableAds');
    allowAcceptableAdsCheckbox.addEventListener('change', (e) => {
        toggleAcceptableAdsFilter(e.target.checked);
    });

    checkboxes.push(new Checkbox('#showTrayIcon', userSettings.names.SHOW_TRAY_ICON));
    checkboxes.push(new Checkbox('#launchAtLogin', userSettings.names.LAUNCH_AT_LOGIN, {
        eventListener() {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'changeLaunchAtLogin',
                'value': this.checked,
            }));
        },
    }));
    checkboxes.push(new Checkbox('#verboseLogging', userSettings.names.VERBOSE_LOGGING));
    checkboxes.push(new Checkbox('#enableHardwareAcceleration', userSettings.names.DISABLE_HARDWARE_ACCELERATION, {
        negate: true,
    }));

    const initUpdateFiltersPeriodSelect = () => {
        const periods = [48, 24, 12, 6, 1]; // in hours
        const periodSelectOptions = periods.map((item) => ({
            value: item,
            name: i18n.__n('options_filters_update_period_number.message', item),
        }));
        periodSelectOptions.push({
            value: -1,
            name: i18n.__('options_filters_period_not_update.message'),
        });

        const currentPeriodValue = userSettings.values[userSettings.names.UPDATE_FILTERS_PERIOD];
        const periodSelect = document.getElementById('filterUpdatePeriod');
        /* eslint-disable-next-line no-unused-expressions */
        periodSelect && periodSelect.addEventListener('change', (event) => {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                type: 'changeUpdateFiltersPeriod',
                value: parseInt(event.target.value, 10),
            }));
        });

        return new Select('filterUpdatePeriod', periodSelectOptions, currentPeriodValue);
    };
    const periodSelect = initUpdateFiltersPeriodSelect();

    const updateAcceptableAdsCheckbox = Utils.debounce((filter) => {
        if (filter.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
            checkboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], filter.enabled);
        }
    }, 500);

    /**
     * Updates `Allow search ads and the self-promotion` checkbox on `Other` group state change
     */
    const updateAcceptableAdsCheckboxByGroupState = Utils.debounce((group) => {
        if (group.groupId === AntiBannerFilterGroupsId.SEARCH_AND_SELF_PROMO_FILTER_GROUP_ID) {
            const selfAdsFilter = group.filters.find((f) => (
                f.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            ));
            const state = group.enabled && selfAdsFilter?.enabled;
            checkboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], state);
        }
    }, 500);

    const checkboxSelectors = {
        'show-app-updated-disabled': '#showAppUpdatedNotification',
        'hardware-acceleration-disabled': '#enableHardwareAcceleration',
        'launch-at-login': '#launchAtLogin',
        'show-tray-icon': '#showTrayIcon',
        'verbose-logging': '#verboseLogging',
        'default-whitelist-mode': '#changeDefaultWhiteListMode',
        'userrules-enabled': '#userrulesInput',
        'allowlist-enabled': '#allowlistInput',
    };

    /**
     * Updates checkbox value by selector name
     * @param {string} propertyName
     * @param {boolean} value
     * @param {boolean} inverted
     */
    const updateCheckboxValue = (propertyName, value, inverted) => {
        const checkbox = document.querySelector(checkboxSelectors[propertyName]);
        checkboxUtils.updateCheckbox([checkbox], inverted ? !value : value);
    };

    const filterUpdatePeriodSelect = document.querySelector('#filterUpdatePeriod');
    const updateFilterUpdatePeriodSelect = (period) => {
        filterUpdatePeriodSelect.value = period;
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
    /* eslint-disable-next-line no-unused-expressions */
    notificationEnableProtectionLink && notificationEnableProtectionLink.addEventListener('click', (e) => {
        e.preventDefault();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: 'enableProtection',
        }));
    });

    const showUpdateIntervalNotification = function () {
        const updateIntervalNotification = document.querySelector('#updateIntervalNotification');
        const hideUpdateIntervalNotificationKey = 'hide-update-interval-notification';
        const hideUpdateIntervalNotification = !!window.sessionStorage.getItem(hideUpdateIntervalNotificationKey);
        if (filterUpdatePeriodSelect.value === '-1' && !hideUpdateIntervalNotification) {
            updateIntervalNotification.style.display = 'flex';
        } else {
            updateIntervalNotification.style.display = 'none';
        }
    };

    const render = function () {
        periodSelect.render();

        for (let i = 0; i < checkboxes.length; i += 1) {
            checkboxes[i].render();
        }

        ipcRenderer.once('isUserrulesEnabledResponse', (e, isUserrulesEnabled) => {
            updateCheckboxValue('userrules-enabled', isUserrulesEnabled, false);
        });

        ipcRenderer.once('isAllowlistEnabledResponse', (e, isAllowlistEnabled) => {
            updateCheckboxValue('allowlist-enabled', isAllowlistEnabled, false);
        });

        ipcRenderer.once('isGroupEnabledResponse', (e, isGroupOtherEnabled) => {
            const isSelfAdsEnabled = isGroupOtherEnabled
                && AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;
            updateAcceptableAdsCheckbox({
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
                enabled: isSelfAdsEnabled,
            });
        });

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isUserrulesEnabled',
        }));

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isAllowlistEnabled',
        }));

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isGroupEnabled',
            'groupId': AntiBannerFilterGroupsId.SEARCH_AND_SELF_PROMO_FILTER_GROUP_ID,
        }));

        showProtectionStatusWarning(isProtectionRunning);
        showUpdateIntervalNotification();
    };

    const updateContentBlockersDescription = (info) => {
        const cbDescription = document.getElementById('options_content_blockers_desc_container');
        if (info.enabledContentBlockersCount === 0) {
            cbDescription.textContent = i18n.__('options_content_blockers_disabled_desc.message');
        } else {
            cbDescription.textContent = i18n.__n(
                'options_content_blockers_desc.message',
                info.enabledContentBlockersCount
            );
        }
    };

    return {
        render,
        updateAcceptableAdsCheckbox,
        updateAcceptableAdsCheckboxByGroupState,
        updateCheckboxValue,
        updateFilterUpdatePeriodSelect,
        showProtectionStatusWarning,
        showUpdateIntervalNotification,
        updateContentBlockersDescription,
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

    init() {
        this._preventDragAndDrop();
        this._customizeText();
        this._bindEvents();
        this._render();

        checkboxUtils.toggleCheckbox(document.querySelectorAll('.opt-state input[type=checkbox]'));

        // Initialize top menu
        TopMenu.init({
            /* eslint-disable-next-line no-unused-vars */
            onHashUpdated(tabId) {
                // Doing nothing
            },
        });

        this.aboutUpdatesBlock = document.getElementById('about-updates');
        this.aboutUpdatesRelaunch = document.getElementById('about-updates-relaunch');

        this._initBoardingScreen();
        this._initUpdatesBlock();
    },

    _bindEvents() {
        const importSettingsBtn = document.querySelector('#settingsImport');
        const exportSettingsBtn = document.querySelector('#settingsExport');
        const importSettingsInput = document.querySelector('#importSettingsInput');
        const exportLogsBtn = document.querySelector('#exportLogs');

        importSettingsBtn.addEventListener('click', this.importSettingsFile.bind(this));
        exportSettingsBtn.addEventListener('click', this.exportSettingsFile.bind(this));
        exportLogsBtn.addEventListener('click', this.exportLogs.bind(this));

        importSettingsInput.addEventListener('change', (event) => {
            try {
                Utils.handleImportSettings(event);
            } catch (err) {
                /* eslint-disable-next-line no-console */
                console.error(err.message);
            }
            importSettingsInput.value = '';
        });
    },

    exportLogs(event) {
        event.preventDefault();
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'exportLogs',
        }));
    },

    importSettingsFile(event) {
        event.preventDefault();
        const importSettingsInput = document.querySelector('#importSettingsInput');
        importSettingsInput.click();
    },

    exportSettingsFile(event) {
        event.preventDefault();
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getUserSettings',
        }));
        ipcRenderer.once('getUserSettingsResponse', (e, response) => {
            Utils.exportFile('adguard-settings', 'json', JSON.stringify(response, null, 4))
                .catch((err) => {
                    /* eslint-disable-next-line no-console */
                    console.error(err.message);
                });
        });
    },

    _initUpdatesBlock() {
        if (!environmentOptions.updatesPermitted) {
            return;
        }

        this.aboutUpdatesBlock.style.display = 'block';
        this.aboutUpdatesRelaunch.addEventListener('click', (e) => {
            e.preventDefault();
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                type: 'updateRelaunch',
            }));
        });

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: 'checkUpdates',
        }));

        window.addEventListener('hashchange', () => {
            if (document.location.hash === '#about') {
                ipcRenderer.send('renderer-to-main', JSON.stringify({
                    type: 'checkUpdates',
                }));
            }
        });
    },

    _initBoardingScreen() {
        const hideExtensionsNotificationKey = 'hide-extensions-notification';
        const hideOnboardingScreenKey = 'hide-onboarding-screen';
        const hideUpdateIntervalNotificationKey = 'hide-update-interval-notification';

        const body = document.querySelector('body');
        const onBoardingScreenEl = body.querySelector('#boarding-screen-placeholder');
        const enableExtensionsNotification = document.getElementById('enableExtensionsNotification');
        const enableCbExtensionsNotification = document.getElementById('enableCbExtensionsNotification');
        const updateIntervalNotification = document.getElementById('updateIntervalNotification');

        const self = this;
        ipcRenderer.on('getSafariExtensionsStateResponse', (e, arg) => {
            const { contentBlockersEnabled, allContentBlockersDisabled, minorExtensionsEnabled } = arg;

            const hideOnboardingScreen = !!window.sessionStorage.getItem(hideOnboardingScreenKey);
            const shouldHideOnboardingScreen = !allContentBlockersDisabled || hideOnboardingScreen;

            body.style.overflow = shouldHideOnboardingScreen ? 'auto' : 'hidden';
            onBoardingScreenEl.style.display = shouldHideOnboardingScreen ? 'none' : 'flex';

            const hideExtensionsNotification = !!window.sessionStorage.getItem(hideExtensionsNotificationKey);
            const extensionsFlag = contentBlockersEnabled && minorExtensionsEnabled;

            if (extensionsFlag) {
                // extensions config had been changed - reset hide-extensions "cookie"
                window.sessionStorage.setItem(hideExtensionsNotificationKey, false);
                window.sessionStorage.setItem(hideOnboardingScreenKey, false);
            }

            const shouldHideNotification = hideExtensionsNotification || extensionsFlag;

            enableExtensionsNotification.style.display = shouldHideNotification ? 'none' : 'flex';
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

        const ignoreSafariSettingsButtons = document.querySelector('#ignore-safari-extensions-settings-btn');
        ignoreSafariSettingsButtons.addEventListener('click', (e) => {
            e.preventDefault();
            body.style.overflow = 'auto';
            onBoardingScreenEl.style.display = 'none';
            window.sessionStorage.setItem(hideOnboardingScreenKey, true);
        });

        const onboardingLink = document.querySelector('#onboarding-link');
        const onboardingTooltip = document.querySelector('#onboarding-tooltip');
        const onboardingPic = document.querySelector('#onboarding-pic');
        onboardingLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (onboardingTooltip.classList.contains('onboarding__tooltip__visible')) {
                onboardingTooltip.classList.remove('onboarding__tooltip__visible');
                onboardingPic.classList.add('onboarding__pic__visible');
            } else {
                onboardingTooltip.classList.add('onboarding__tooltip__visible');
                onboardingPic.classList.remove('onboarding__pic__visible');
            }
        });

        const enableExtensionsNotificationClose = document.getElementById('enableExtensionsNotificationClose');
        enableExtensionsNotificationClose.addEventListener('click', (e) => {
            e.preventDefault();
            enableExtensionsNotification.style.display = 'none';

            window.sessionStorage.setItem(hideExtensionsNotificationKey, true);
        });

        const updateIntervalNotificationClose = document.getElementById('updateIntervalNotificationClose');
        updateIntervalNotificationClose.addEventListener('click', (e) => {
            e.preventDefault();
            updateIntervalNotification.style.display = 'none';

            window.sessionStorage.setItem(hideUpdateIntervalNotificationKey, true);
        });

        this.checkSafariExtensions();
        window.addEventListener('focus', () => this.checkSafariExtensions());
    },

    checkSafariExtensions() {
        this.contentBlockers.setLoading();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getSafariExtensionsState',
        }));
    },

    _openSafariExtensionsPrefs() {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'openSafariExtensionsPrefs',
        }));
    },

    _customizeText() {
        document.querySelectorAll('a.sp-table-row-info').forEach((a) => {
            a.classList.add('question');
            a.textContent = '';
        });

        document.querySelectorAll('span.sp-table-row-info').forEach((element) => {
            const li = element.closest('li');
            element.parentNode.removeChild(element);

            const state = li.querySelector('.opt-state');
            element.classList.add('desc');
            state.insertBefore(element, state.firstChild);
        });
    },

    _render() {
        if (environmentOptions.Prefs.mobile) {
            document.querySelector('#resetStats').style.display = 'none';
        }

        this.settings = new Settings();
        this.settings.render();

        // Initialize whitelist filter
        this.whiteListFilter = new WhiteListFilter(userSettings, contentBlockerInfo);
        this.whiteListFilter.updateWhiteListDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules(contentBlockerInfo);

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters(
            { rulesInfo: contentBlockerInfo },
            contentBlockerInfo,
            environmentOptions,
            userSettings
        );
        this.antiBannerFilters.render();

        // Initialize Content blockers
        this.contentBlockers = new ContentBlockersScreen(
            this.antiBannerFilters,
            this.userFilter,
            this.whiteListFilter,
            userSettings
        );
        this.contentBlockers.init();

        document.querySelector('#about-version-placeholder')
            .textContent = i18n.__('options_about_version.message', environmentOptions.appVersion);
    },

    _preventDragAndDrop() {
        document.addEventListener('dragover', (event) => {
            event.preventDefault();
            return false;
        }, false);

        document.addEventListener('drop', (event) => {
            event.preventDefault();
            return false;
        }, false);
    },

    onAppUpdateFound() {
        this.aboutUpdatesBlock.innerText = i18n.__('options_about_updating.message');
    },

    onAppUpdateNotFound() {
        this.aboutUpdatesBlock.classList.remove('about-updates--rotate');
        this.aboutUpdatesBlock.classList.add('about-updates--hidden');
        this.aboutUpdatesBlock.innerText = i18n.__('options_about_updates_not_found.message');
    },

    onAppUpdateDownloaded() {
        this.aboutUpdatesBlock.classList.remove('about-updates--rotate');
        this.aboutUpdatesBlock.classList.add('about-updates--hidden');
        this.aboutUpdatesBlock.innerText = i18n.__('options_about_update_downloaded.message');

        this.aboutUpdatesRelaunch.classList.remove('about-btn--hidden');
    },
};

let userSettings;
let enabledFilters;
let environmentOptions;
let AntiBannerFiltersId;
let AntiBannerFilterGroupsId;
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
    AntiBannerFilterGroupsId = response.constants.AntiBannerFilterGroupsId;

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
                    controller.antiBannerFilters.render();
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    // re-render fully only if custom filter was added,
                    // if re-render every time, then filters move inconsistently because of sorting
                    // on first filter enabling, when this event fires
                    if (options && options.customUrl) {
                        controller.antiBannerFilters.render();
                    }
                    break;
                case EventNotifierTypes.FILTER_GROUP_ENABLE_DISABLE:
                    controller.antiBannerFilters.onCategoryStateChanged(options);
                    controller.settings.updateAcceptableAdsCheckboxByGroupState(options);
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
                    controller.userFilter.updateUserFilterRules(contentBlockerInfo);
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
                    const userFilterEnabled = userSettings.values[userSettings.names.USERRULES_ENABLED]
                        && !controller.userFilter.isUserFilterEmpty();
                    const allowlistEnabled = userSettings.values[userSettings.names.ALLOWLIST_ENABLED]
                        && !controller.whiteListFilter.isAllowlistEmpty();
                    const filtersInfo = controller.antiBannerFilters
                        .getFiltersInfo(options.filterGroups, userFilterEnabled, allowlistEnabled);
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
                case EventNotifierTypes.SETTING_UPDATED:
                    controller.settings.updateCheckboxValue(
                        options.propertyName,
                        options.propertyValue,
                        options.inverted
                    );
                    break;
                case EventNotifierTypes.FILTERS_PERIOD_UPDATED:
                    controller.settings.updateFilterUpdatePeriodSelect(options);
                    controller.settings.showUpdateIntervalNotification();
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
    };

    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
        onDocumentReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
};

ipcRenderer.on('initializeOptionsPageResponse', (e, arg) => {
    initPage(arg);
});

ipcRenderer.send('renderer-to-main', JSON.stringify({
    'type': 'initializeOptionsPage',
}));
