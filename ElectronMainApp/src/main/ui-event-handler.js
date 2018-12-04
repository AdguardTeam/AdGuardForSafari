const {ipcMain} = require('electron');
const config = require('config');
const settings = require('./app/settings-manager');
const filters = require('./app/filters-manager');
const filterCategories = require('./app/filters/filters-categories');
const listeners = require('./notifier');
const whitelist = require('./app/whitelist');
const userrules = require('./app/userrules');
const antibanner = require('./app/antibanner');
const app = require('./app/app');
const safariToolbar = require('safari-ext');

/**
 * Initializes event listener
 */
module.exports.init = function () {

    // Handle messages from renderer process
    ipcMain.on('renderer-to-main', function (event, arg) {

        const message = JSON.parse(arg);
        switch (message.type) {
            case 'initializeOptionsPage':
                event.sender.send('initializeOptionsPageResponse', processInitializeFrameScriptRequest());
                break;
            case 'getFiltersMetadata':
                event.sender.send('getFiltersMetadataResponse', filterCategories.getFiltersMetadata());
                break;
            case 'changeUserSetting':
                settings.setProperty(message.key, message.value);
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
            case 'disableFiltersGroup':
                filters.disableFiltersGroup(message.groupId);
                break;
            case 'getWhiteListDomains':
                const whiteListDomains = whitelist.getWhiteListDomains();
                event.returnValue = {content: whiteListDomains.join('\r\n')};
                break;
            case 'saveWhiteListDomains':
                const domains = message.content.split(/[\r\n]+/);
                whitelist.updateWhiteListDomains(domains);
                break;
            case 'changeDefaultWhiteListMode':
                whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'getUserRules':
                userrules.getUserRulesText(function (content) {
                    event.sender.send('getUserRulesResponse', {content: content});
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
                filters.loadCustomFilter(message.url, (filter) => event.sender.send('loadCustomFilterInfoResponse', filter),
                    () => event.sender.send('loadCustomFilterInfoResponse', null));
                break;
            case 'checkContentBlockerExtension':
                safariToolbar.extensionContentBlockerState((result) => {
                    event.sender.send('checkContentBlockerExtensionResponse', result);
                });
                break;
            case 'checkSafariIconExtension':
                safariToolbar.extensionSafariIconState((result) => {
                    event.sender.send('checkSafariIconExtensionResponse', result);
                });
                break;
            case 'openSafariExtensionsPrefs':
                safariToolbar.openExtensionsPreferenses(()=> {
                    //Do nothing
                });
                break;
            case  'changeUpdateFiltersPeriod':
                settings.changeUpdateFiltersPeriod(message.value);
                break;
        }
    });

};

function eventHandler(win) {
    return function () {
        win.webContents.send('main-to-renderer', {
            type: 'message',
            args: Array.prototype.slice.call(arguments)
        });
    };
}

module.exports.register = (win) => {
    //Retranslate messages to renderer process
    listeners.addListener(eventHandler(win));
};

/**
 * Constructs data object for page presentation
 */
function processInitializeFrameScriptRequest() {

    const enabledFilters = Object.create(null);

    const AntiBannerFiltersId = config.get('AntiBannerFiltersId');

    for (let key in AntiBannerFiltersId) {
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
        enabledFilters: enabledFilters,
        filtersMetadata: filters.getFilters(),
        contentBlockerInfo: antibanner.getContentBlockerInfo(),
        environmentOptions: {
            isMacOs: true,
            Prefs: {
                locale: app.getLocale(),
                mobile: false
            },
            appVersion: app.getVersion()
        },
        constants: {
            AntiBannerFiltersId: AntiBannerFiltersId
        }
    };
}