/* global EventNotifierTypes */

const { ipcRenderer } = require('electron');

// eslint-disable-next-line import/no-unresolved
const PageController = require('./js/page-controller');

/**
 * Initializes page
 */
const initPage = function (response) {
    const {
        userSettings,
        enabledFilters,
        environmentOptions,
        contentBlockerInfo,
        isProtectionRunning,
        rulesLimit,
    } = response;

    const { AntiBannerFiltersId, AntiBannerFilterGroupsId } = response.constants;

    const onDocumentReady = function () {
        const controller = new PageController(
            userSettings,
            enabledFilters,
            environmentOptions,
            isProtectionRunning,
            AntiBannerFiltersId,
            AntiBannerFilterGroupsId,
            contentBlockerInfo,
            rulesLimit
        );
        controller.init();

        ipcRenderer.on('main-to-renderer', (e, arg) => {
            const [event, options] = arg.args;

            switch (event) {
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    controller.settings.updateAcceptableAdsCheckbox(options);
                    controller.contentBlockers.setLoading();
                    controller.antiBannerFilters.updateData();
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    if (options && options.customUrl) {
                        controller.antiBannerFilters.renderCustomFilters();
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
                    controller.settings.updateUserFilterState();
                    controller.userFilter.updateUserFilterRules(contentBlockerInfo);
                    controller.contentBlockers.setLoading();
                    break;
                case EventNotifierTypes.UPDATE_ALLOWLIST_FILTER_RULES:
                    controller.settings.updateAllowlistState();
                    controller.allowlistFilter.loadAllowlistDomains();
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
                        && !controller.allowlistFilter.isAllowlistEmpty();
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
                    controller.settings.updateAllowlistDefaultMode(
                        options.propertyName,
                        options.propertyValue
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
                case EventNotifierTypes.APPLICATION_UPDATE_NOT_ALLOWED:
                    controller.onAppUpdateNotAllowed(options);
                    break;
                case EventNotifierTypes.APPLICATION_UPDATE_ERROR:
                    controller.onAppUpdateError();
                    break;
                case EventNotifierTypes.APPLICATION_UPDATE_DOWNLOADED:
                    controller.onAppUpdateDownloaded(options);
                    break;
                case EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP:
                    controller.antiBannerFilters.onFilterUpdatesFinished(
                        options.updatedFilters,
                        options.filtersUpdateLastCheck
                    );
                    break;
                case EventNotifierTypes.CUSTOM_FILTER_INFO_SET: {
                    controller.onCustomFilterSubscribe(options);
                    break;
                }
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
