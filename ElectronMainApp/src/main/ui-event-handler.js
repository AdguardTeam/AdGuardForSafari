const { ipcMain } = require('electron');
const config = require('config');
const safariToolbar = require('safari-ext');
const settings = require('./app/settings-manager');
const settingsBackup = require('./app/settings-provider');
const filters = require('./app/filters-manager');
const filterCategories = require('./app/filters/filters-categories');
const listeners = require('./notifier');
const { exportLogs } = require('./app/utils/log-service');
const whitelist = require('./app/whitelist');
const userrules = require('./app/userrules');
const antibanner = require('./app/antibanner');
const app = require('./app/app');
const applicationApi = require('./api');
const updater = require('./updater');
const log = require('./app/utils/log');
const toolbarController = require('./toolbar-controller');
const { getContentBlockersInfo } = require('./app/content-blocker/content-blocker-adapter');

/**
 * Initializes event listener
 */
module.exports.init = function () {
    // Handle messages from renderer process
    ipcMain.on('renderer-to-main', (event, arg) => {
        const message = JSON.parse(arg);
        switch (message.type) {
            case 'initializeOptionsPage':
                sendResponse(event, 'initializeOptionsPageResponse', processInitializeFrameScriptRequest());
                break;
            case 'getFiltersMetadata':
                const filtersMetadata = filterCategories.getFiltersMetadata();
                filtersMetadata.rulesInfo = antibanner.getContentBlockerInfo();
                sendResponse(event, 'getFiltersMetadataResponse', filtersMetadata);
                break;
            case 'changeUserSetting':
                settings.setProperty(message.key, message.value);
                break;
            case 'changeLaunchAtLogin':
                settings.changeLaunchAtLogin(message.value);
                break;
            case 'addAndEnableFilter':
                filters.addAndEnableFilters([message.filterId]);
                break;
            case 'disableFilter':
                filters.disableFilters([message.filterId]);
                break;
            case 'enableFiltersGroup':
                filters.enableFiltersGroup(message.groupId);
                break;
            case 'isGroupEnabled':
                const isEnabled = filters.isGroupEnabled(message.groupId);
                sendResponse(event, 'isGroupEnabledResponse', isEnabled);
                break;
            case 'disableFiltersGroup':
                filters.disableFiltersGroup(message.groupId);
                break;
            case 'isUserrulesEnabled':
                const isUserrulesEnabled = settings.isUserrulesEnabled();
                sendResponse(event, 'isUserrulesEnabledResponse', isUserrulesEnabled);
                break;
            case 'toggleUserrulesState':
                settings.changeUserrulesState(message.enabled);
                break;
            case 'isAllowlistEnabled':
                const isAllowlistEnabled = settings.isAllowlistEnabled();
                sendResponse(event, 'isAllowlistEnabledResponse', isAllowlistEnabled);
                break;
            case 'toggleAllowlistState':
                settings.changeAllowlistState(message.enabled);
                break;
            case 'getWhiteListDomains':
                const whiteListDomains = whitelist.getWhiteListDomains();
                event.returnValue = { content: whiteListDomains.join('\r\n') };
                break;
            case 'saveWhiteListDomains':
                const domains = message.content.split(/[\r\n]+/);
                whitelist.updateWhiteListDomains(domains);
                break;
            case 'changeDefaultWhiteListMode':
                whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'getUserRules':
                userrules.getUserRules((content) => {
                    sendResponse(event, 'getUserRulesResponse', { content });
                });
                break;
            case 'saveUserRules':
                userrules.updateUserRulesText(message.content);
                break;
            case 'checkAntiBannerFiltersUpdate':
                filters.checkAntiBannerFiltersUpdate(true);
                break;
            case 'removeAntiBannerFilter':
                filters.removeFilter(message.filterId);
                break;
            case 'loadCustomFilterInfo':
                filters.loadCustomFilterInfo(message.url, { title: message.title },
                    (filter) => sendResponse(event, 'loadCustomFilterInfoResponse', filter),
                    () => sendResponse(event, 'loadCustomFilterInfoResponse', null));
                break;
            case 'subscribeToCustomFilter':
                const { url, title, trusted } = message;
                filters.subscribeToCustomFilter(
                    url,
                    { title, trusted },
                    (filter) => {
                        filters.addAndEnableFilters([filter.filterId]);
                        sendResponse(event, 'subscribeToCustomFilterSuccessResponse');
                    },
                    () => { sendResponse(event, 'subscribeToCustomFilterErrorResponse'); }
                );
                break;
            case 'getSafariExtensionsState':
                toolbarController.getExtensionsState((result) => {
                    sendResponse(event, 'getSafariExtensionsStateResponse', result);
                });
                break;
            case 'getContentBlockersMetadata':
                sendResponse(event, 'getContentBlockersMetadataResponse', getContentBlockersInfo());
                break;
            case 'getUserSettings':
                settingsBackup.loadSettingsBackup((settings) => {
                    sendResponse(event, 'getUserSettingsResponse', settings);
                });
                break;
            case 'applyUserSettings':
                settingsBackup.applySettingsBackup(message.settings);
                break;
            case 'openSafariExtensionsPrefs':
                safariToolbar.openExtensionsPreferences(() => {
                    // Do nothing
                });
                break;
            case 'exportLogs':
                exportLogs();
                break;
            case 'changeUpdateFiltersPeriod':
                settings.changeUpdateFiltersPeriod(message.value);
                break;
            case 'enableProtection':
                applicationApi.start();
                break;
            case 'checkUpdates':
                updater.checkForUpdates();
                break;
            case 'updateRelaunch':
                updater.quitAndInstall();
                break;
        }
    });
};

/**
 * Send response to event
 *
 * @param event
 * @param message
 * @param payload
 */
function sendResponse(event, message, payload) {
    try {
        if (event.sender) {
            event.sender.send(message, payload);
        }
    } catch (e) {
        log.error(e);
    }
}

/**
 * Retranslate messages to renderer process
 *
 * @param win
 * @return {Function}
 */
function eventHandler(win) {
    return function () {
        try {
            win.webContents.send('main-to-renderer', {
                type: 'message',
                args: Array.prototype.slice.call(arguments),
            });
        } catch (e) {
            log.error(e);
        }
    };
}

/**
 * Register window object
 *
 * @param win
 */
module.exports.register = (win) => {
    win.listenerId = listeners.addListener(eventHandler(win));
};

/**
 * Unregister window object
 *
 * @param win
 */
module.exports.unregister = (win) => {
    if (win) {
        const { listenerId } = win;
        if (listenerId) {
            log.info('Removing listener');
            listeners.removeListener(listenerId);
        }
    }
};

/**
 * Constructs data object for page presentation
 */
function processInitializeFrameScriptRequest() {
    const enabledFilters = Object.create(null);

    const AntiBannerFiltersId = config.get('AntiBannerFiltersId');
    const AntiBannerFilterGroupsId = config.get('AntiBannerFilterGroupsId');

    for (const key in AntiBannerFiltersId) {
        if (AntiBannerFiltersId.hasOwnProperty(key)) {
            const filterId = AntiBannerFiltersId[key];
            const enabled = filters.isFilterEnabled(filterId);
            if (enabled) {
                enabledFilters[filterId] = true;
            }
        }
    }

    return {
        userSettings: settings.getAllSettings(),
        enabledFilters,
        filtersMetadata: filters.getFilters(),
        contentBlockerInfo: antibanner.getContentBlockerInfo(),
        isProtectionRunning: antibanner.isRunning(),
        environmentOptions: {
            isMacOs: true,
            Prefs: {
                locale: app.getLocale(),
                mobile: false,
            },
            appVersion: app.getVersion(),
            updatesPermitted: updater.isUpdatePermitted(),
        },
        constants: {
            AntiBannerFiltersId,
            AntiBannerFilterGroupsId,
        },
    };
}
