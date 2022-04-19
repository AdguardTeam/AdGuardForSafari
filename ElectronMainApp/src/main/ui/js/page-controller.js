/* global i18n */

const { ipcRenderer, shell } = require('electron');
const AllowlistFilter = require('./filters/allowlist-filter');
const UserFilter = require('./filters/user-filter');
const utils = require('./utils/common-utils');
const checkboxUtils = require('./utils/checkbox-utils');
const topMenu = require('./top-menu');
const ContentBlockersScreen = require('./content-blockers');
const AntiBannerFilters = require('./filters/antibanner-filters/antibanner-filters');
const Settings = require('./general-settings');

const CONTENT_BLOCKERS_COUNT = 6;

/**
 * Page controller
 *
 * @constructor
 */
const PageController = function (
    userSettings,
    enabledFilters,
    environmentOptions,
    isProtectionRunning,
    AntiBannerFiltersId,
    AntiBannerFilterGroupsId,
    contentBlockerInfo,
    rulesLimit
) {
    this.userSettings = userSettings;
    this.enabledFilters = enabledFilters;
    this.environmentOptions = environmentOptions;
    this.isProtectionRunning = isProtectionRunning;
    this.AntiBannerFiltersId = AntiBannerFiltersId;
    this.AntiBannerFilterGroupsId = AntiBannerFilterGroupsId;
    this.contentBlockerInfo = contentBlockerInfo;
    this.rulesLimit = rulesLimit;
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
        topMenu.init({
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
                utils.handleImportSettings(event);
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
            utils.exportFile('adguard-settings', 'json', JSON.stringify(response, null, 4))
                .catch((err) => {
                    /* eslint-disable-next-line no-console */
                    console.error(err.message);
                });
        });
    },

    _initUpdatesBlock() {
        if (!this.environmentOptions.updatesPermitted) {
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

        const onBoardingScreenEl = document.querySelector('#boarding-screen-placeholder');
        const settingsWrap = document.querySelector('.settings-wrap');
        const enableExtensionsNotification = document.getElementById('enableExtensionsNotification');
        const enableCbExtensionsNotification = document.getElementById('enableCbExtensionsNotification');
        const updateIntervalNotification = document.getElementById('updateIntervalNotification');

        const onboardingContentBlockersInfo = document.querySelector('.onboarding__tooltip__content_blockers_info');
        onboardingContentBlockersInfo.innerHTML = i18n.__(
            'onboarding_tooltip_adguard_safari_content_blockers_info.message',
            this.rulesLimit,
            this.rulesLimit * CONTENT_BLOCKERS_COUNT
        );

        const self = this;
        ipcRenderer.on('getSafariExtensionsStateResponse', (e, arg) => {
            const { contentBlockersEnabled, allContentBlockersDisabled, minorExtensionsEnabled } = arg;

            const hideOnboardingScreen = !!window.sessionStorage.getItem(hideOnboardingScreenKey);
            const shouldHideOnboardingScreen = !allContentBlockersDisabled || hideOnboardingScreen;

            settingsWrap.style.overflow = shouldHideOnboardingScreen ? 'initial' : 'hidden';
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
            settingsWrap.style.overflow = 'initial';
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
        if (this.environmentOptions.Prefs.mobile) {
            document.querySelector('#resetStats').style.display = 'none';
        }

        this.settings = new Settings(
            this.userSettings,
            this.enabledFilters,
            this.AntiBannerFiltersId,
            this.AntiBannerFilterGroupsId,
            this.isProtectionRunning,
            this.rulesLimit
        );
        this.settings.render();

        // Initialize allowlist filter
        this.allowlistFilter = new AllowlistFilter(this.userSettings, this.contentBlockerInfo);
        this.allowlistFilter.loadAllowlistDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules(this.contentBlockerInfo);

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters(
            { rulesInfo: this.contentBlockerInfo },
            this.contentBlockerInfo,
            this.environmentOptions,
            this.userSettings,
            this.rulesLimit
        );
        this.antiBannerFilters.init();
        this.antiBannerFilters.updateData();

        // Initialize Content blockers
        this.contentBlockers = new ContentBlockersScreen(
            this.antiBannerFilters,
            this.userFilter,
            this.allowlistFilter,
            this.userSettings,
            this.rulesLimit
        );
        this.contentBlockers.init();

        document.querySelector('#about-version-placeholder')
            .textContent = i18n.__('options_about_version.message', this.environmentOptions.appVersion);

        this.resolveIncorrectBlockingLink();
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

    onAppUpdateError() {
        this.aboutUpdatesBlock.classList.remove('about-updates--rotate');
        this.aboutUpdatesBlock.classList.add('about-updates--hidden');
        this.aboutUpdatesBlock.innerText = i18n.__('options_about_updates_error.message');
    },

    resolveIncorrectBlockingLink() {
        const incorrectBlockingLink = document.querySelector('#incorrect-blocking-link');
        const REPORT_URL = 'https://reports.adguard.com/en/new_issue.html?product_type=Saf';
        const versionArg = `&product_version=${this.environmentOptions.appVersion}`;
        const BROWSER_ARG = '&browser=Safari';

        incorrectBlockingLink.addEventListener('click', (event) => {
            event.preventDefault();

            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'getUserSettings',
            }));
            ipcRenderer.once('getUserSettingsResponse', (e, response) => {
                const enabledFiltersIds = response.filters['enabled-filters'];
                const enabledCustomFiltersUrls = response.filters['custom-filters']
                    .filter((f) => f.enabled)
                    .map((f) => encodeURIComponent(f.customUrl));

                const filtersArg = enabledFiltersIds.length
                    ? `&filters=${enabledFiltersIds.join('.')}`
                    : '';

                const customFiltersArg = enabledCustomFiltersUrls.length
                    ? `&custom_filters=${enabledCustomFiltersUrls.join(',')}`
                    : '';

                const incorrectBlockingLinkUrl = REPORT_URL + BROWSER_ARG + versionArg + filtersArg + customFiltersArg;
                shell.openExternal(incorrectBlockingLinkUrl);
            });
        });
    },
};

module.exports = PageController;
