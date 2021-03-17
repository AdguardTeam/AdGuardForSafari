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
// eslint-disable-next-line import/no-unresolved
const Settings = require('./js/general-settings');

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

        this.settings = new Settings(
            userSettings,
            enabledFilters,
            AntiBannerFiltersId,
            AntiBannerFilterGroupsId,
            isProtectionRunning
        );
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
