const {ipcMain} = require('electron');

const settings = require('./lib/settings-manager');
const filterUtils = require('./lib/utils/filter-utils');
const filters = require('./lib/filters-manager');
const filterCategories = require('./lib/filters-categories');

/**
 * Initializes event listener
 */
module.exports.init = function () {
    ipcMain.on('message', function (event, arg) {

        const message = JSON.parse(arg);
        switch (message.type) {
            case 'initializeOptionsPage':
                event.sender.send('initializeOptionsPageResponse', processInitializeFrameScriptRequest());
                break;
            case 'getFiltersMetadata':
                event.sender.send('getFiltersMetadataResponse', filterCategories.getFiltersMetadata());
                break;
        }
    });
};

/**
 * Constructs data object for page presentation
 */
function processInitializeFrameScriptRequest() {

    const enabledFilters = Object.create(null);

    const AntiBannerFiltersId = filterUtils.ids;

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
        requestFilterInfo: filters.getRequestFilterInfo(),
        //syncStatusInfo: adguard.sync.syncService.getSyncStatus(),
        environmentOptions: {
            isMacOs: true,
            Prefs: {
                locale: 'en',
                mobile: false
            }
        },
        constants: {
            AntiBannerFiltersId: filterUtils.ids
        }
    };
}