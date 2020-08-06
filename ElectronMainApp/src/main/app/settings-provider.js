const filters = require('./filters-manager');
const subscriptions = require('./filters/subscriptions');
const app = require('./app');
const settingsManager = require('./settings-manager');
const userRules = require('./userrules');
const whitelist = require('./whitelist');
const log = require('./utils/log');
const config = require('config');
const listeners = require('../notifier');
const events = require('../events');

/**
 * Application settings provider.
 */
module.exports = (() => {

    const BACKUP_PROTOCOL_VERSION = '1.0';

    const settings = settingsManager.getAllSettings();

    /**
     * Collect enabled filters ids without custom filters
     * @returns {Array}
     */
    const collectEnabledFilterIds = () => {
        const enabledFilters = filters.getFilters();
        return enabledFilters
            .filter(filter => !filter.customUrl && filter.enabled)
            .map(filter => filter.filterId);
    };

    /**
     * Collects data about added custom filters to the extension
     * @returns {CustomFilterInitial} - returns data enough to import custom filter
     */
    const collectCustomFiltersData = () => {
        const customFilters = filters.getCustomFilters();
        debugger;
        return customFilters.map(filter => ({
            filterId: filter.filterId,
            customUrl: filter.customUrl,
            enabled: filter.enabled,
            title: filter.name || '',
            trusted: filter.trusted,
        }));
    };

    const collectEnabledGroupIds = () => {
        const groups = subscriptions.getGroups();
        return groups
            .filter(group => group.enabled)
            .map(group => group.groupId);
    };

    /**
     * Loads filters settings section
     * @param callback
     */
    const loadFiltersSection = (callback) => {
        const enabledFilterIds = collectEnabledFilterIds();
        const enabledGroupIds = collectEnabledGroupIds();
        const customFiltersData = collectCustomFiltersData();

        // Collect whitelist/blacklist domains and whitelist mode
        const whiteListDomains = whitelist.getWhiteListedDomains() || [];
        const blockListDomains = whitelist.getBlockListedDomains() || [];
        const defaultWhiteListMode = !!whitelist.isDefaultMode();

        // Collect user rules
        userRules.getUserRulesText((content) => {
            const section = {
                'filters': {
                    'enabled-groups': enabledGroupIds,
                    'enabled-filters': enabledFilterIds,
                    'custom-filters': customFiltersData,
                    'user-filter': {
                        'rules': content,
                        'disabled-rules': '',
                    },
                    'whitelist': {
                        'inverted': !defaultWhiteListMode,
                        'domains': whiteListDomains,
                        'inverted-domains': blockListDomains,
                    },
                },
            };

            callback(section);
        });
    };

    /**
     * Loads general settings section
     * @param callback
     */
    const loadGeneralSettingsSection = (callback) => {
        const enabledFilterIds = collectEnabledFilterIds();
        const allowAcceptableAds = enabledFilterIds.indexOf(config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID) >= 0;

        const section = {
            'general-settings': {
                'app-language': app.getLocale(),
                'allow-acceptable-ads': allowAcceptableAds,
                'show-app-updated-disabled': !settingsManager.isShowAppUpdatedNotification(),
                'update-filters-period': settings.values['update-filters-period'],
                // 'show-adguard-in-menu-bar': settings.values['...'],
                'launch-adguard-at-login': settings.values['launch-at-login'],
                'verbose-logging': settings.values['verbose-logging'],
                'hardware-acceleration-disabled': settingsManager.isHardwareAccelerationDisabled(),
            },
        };
        callback(section);
    };

    /**
     * Applies general section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyGeneralSettingsSection = function (section, callback) {
        const set = section['general-settings'];

        settingsManager.changeShowAppUpdatedNotification(set['show-app-updated-disabled']);
        settingsManager.changeUpdateFiltersPeriod(set['update-filters-period']);
        settingsManager.changeLaunchAtLogin(set['launch-adguard-at-login']);
        settingsManager.changeVerboseLogging(set['verbose-logging']);
        settingsManager.changeHardwareAcceleration(set['hardware-acceleration-disabled']);

        if (set['allow-acceptable-ads']) {
            filters.addAndEnableFilters([config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID]);
        } else {
            filters.disableFilters([config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID]);
        }

        callback(true);
    };

    /**
     * Initial data needed to add custom filter from the scratch
     * @typedef {Object} CustomFilterInitial
     * @property {string} customUrl - url of the custom filter
     * @property {boolean} enabled - state of custom filter
     * @property {number} [filterId] - identifier of the filter
     * @property {boolean} [trusted] - trusted flag of the filter
     * @property {string} [title] - title of the filter
     */

    /**
     * Add a custom filter
     * @param {CustomFilterInitial} customFilterData - initial data of imported custom filter
     * @returns {Promise<any>} SubscriptionFilter
     */
    const addCustomFilter = (customFilterData) => {
        const {
            customUrl, title, trusted,
        } = customFilterData;

        return new Promise((resolve, reject) => {
            const options = {title, trusted};
            filters.loadCustomFilterInfo(
                customUrl,
                options,
                (filter) => {
                    resolve(filter);
                },
                () => {
                    reject();
                }
            );
        });
    };

    const addCustomFilters = absentCustomFiltersInitials => absentCustomFiltersInitials
        .reduce((promiseAcc, customFilterInitial) => promiseAcc
            .then(acc => addCustomFilter(customFilterInitial)
                .then((customFilter) => {
                    log.info(`Settings sync: Was added custom filter: ${customFilter.customUrl}`);
                    return [...acc, {error: null, filter: customFilter}];
                })
                .catch(() => {
                    const {customUrl} = customFilterInitial;
                    const message = `Settings sync: Some error happened while downloading: ${customUrl}`;
                    log.info(message);
                    return [...acc, {error: message}];
                })), Promise.resolve([]));

    /**
     * Removes existing custom filters before adding new custom filters
     */
    const removeCustomFilters = (filterIds) => {
        filterIds.forEach((filterId) => {
            filters.removeFilter(filterId);
        });
    };

    /**
     * Returns filterId which not listed in the filtersToAdd list, but listed in the existingFilters
     * @param existingFilters
     * @param filtersToAdd
     * @returns {array<number>}
     */
    const getCustomFiltersToRemove = (existingFilters, filtersToAdd) => {
        const customUrlsToAdd = filtersToAdd.map(f => f.customUrl);
        const filtersToRemove = existingFilters.filter(f => !customUrlsToAdd.includes(f.customUrl));
        return filtersToRemove.map(f => f.filterId);
    };

    /**
     * Adds custom filters if there were not added one by one to the subscriptions list
     * @param {Array<CustomFilterInitial>} customFiltersInitials
     * @returns {Promise<any>} Promise object which represents array with filters
     */
    const syncCustomFilters = (customFiltersInitials) => {
        const presentCustomFilters = filters.getCustomFilters();

        const enrichedFiltersInitials = customFiltersInitials.map((filterToAdd) => {
            presentCustomFilters.forEach((existingFilter) => {
                if (existingFilter.customUrl === filterToAdd.customUrl) {
                    filterToAdd.filterId = existingFilter.filterId;
                }
            });
            return filterToAdd;
        });

        const customFiltersToAdd = enrichedFiltersInitials.filter(f => !f.filterId);
        const existingCustomFilters = enrichedFiltersInitials.filter(f => f.filterId);
        const redundantExistingCustomFiltersIds = getCustomFiltersToRemove(presentCustomFilters, customFiltersInitials);

        if (redundantExistingCustomFiltersIds.length > 0) {
            removeCustomFilters(redundantExistingCustomFiltersIds);
        }

        if (customFiltersToAdd.length === 0) {
            return Promise.resolve(enrichedFiltersInitials);
        }

        return addCustomFilters(customFiltersToAdd)
            .then((customFiltersAddResult) => {
                // get results without errors, in order to do not enable filters with errors
                const addedCustomFiltersWithoutError = customFiltersAddResult
                    .filter(f => f.error === null)
                    .map(f => f.filter);

                const addedCustomFiltersIds = addedCustomFiltersWithoutError.map(f => f.filterId);
                log.info(`Settings sync: Were added custom filters: ${addedCustomFiltersIds}`);

                return [...existingCustomFilters, ...addedCustomFiltersWithoutError];
            });
    };

    /**
     * Enables filters by filterId and disables those filters which were not in the list of enabled filters
     * @param {array<number>} filterIds - ids to enable
     * @returns {Promise<any>}
     */
    const syncEnabledFilters = filterIds => new Promise((resolve) => {
        filters.addAndEnableFilters(filterIds);
        const enabledFilters = filters.getEnabledFilters();
        const filtersToDisable = enabledFilters
            .filter(enabledFilter => !filterIds.includes(enabledFilter.filterId))
            .map(filter => filter.filterId);
        filters.disableFilters(filtersToDisable);
        resolve();
    });

    /**
     * Enables groups by groupId and disable those groups which were not in the list
     * @param {array<number>} enabledGroups
     */
    const syncEnabledGroups = (enabledGroups) => {
        enabledGroups.forEach((groupId) => {
            filters.enableGroup(groupId);
        });
        log.info(`Settings sync: Next groups were enabled: ${enabledGroups}`);

        // disable groups not listed in the imported list
        const groups = subscriptions.getGroups();

        const groupIdsToDisable = groups
            .map(group => group.groupId)
            .filter(groupId => !enabledGroups.includes(groupId - 0));
        groupIdsToDisable.forEach((groupId) => {
            filters.disableGroup(groupId);
        });
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyFiltersSection = function (section, callback) {
        const whiteListSection = section.filters['whitelist'] || {};
        const whitelistDomains = whiteListSection.domains || [];
        const blacklistDomains = whiteListSection['inverted-domains'] || [];

        // Apply whitelist/blacklist domains and whitelist mode
        whitelist.configure(whitelistDomains, blacklistDomains, !whiteListSection.inverted);

        const userFilterSection = section.filters['user-filter'] || {};
        const userRulesData = userFilterSection.rules || '';

        // Apply user rules
        userRules.updateUserRulesText(userRulesData);

        // Apply custom filters
        const customFiltersData = section.filters['custom-filters'] || [];

        // STEP 1 sync custom filters
        syncCustomFilters(customFiltersData)
            .then((availableCustomFilters) => {
                // STEP 2 get filters with enabled flag from export data
                const customFilterIdsToEnable = availableCustomFilters
                    .filter((availableCustomFilter) => {
                        const filterData = customFiltersData
                            .find((filter) => {
                                if (!filter.customUrl) {
                                    // eslint-disable-next-line max-len
                                    throw new Error(`Custom filter should always have custom URL: ${JSON.stringify(filter)}`);
                                }
                                return filter.customUrl === availableCustomFilter.customUrl;
                            });
                        return filterData && filterData.enabled;
                    })
                    .map(filter => filter.filterId);
                // STEP 3 sync enabled filters
                const enabledFilterIds = section.filters['enabled-filters'] || [];
                return syncEnabledFilters([...enabledFilterIds, ...customFilterIdsToEnable]);
            })
            .then(() => {
                // STEP 4 sync enabled groups
                const enabledGroups = section.filters['enabled-groups'] || [];
                syncEnabledGroups(enabledGroups);
                callback(true);
            })
            .catch((err) => {
                log.error(err);
            });
    };

    /**
     * Exports settings set in json format
     */
    const loadSettingsBackupJson = function (callback) {
        const result = {
            'protocol-version': BACKUP_PROTOCOL_VERSION,
        };

        loadGeneralSettingsSection((section) => {
            result['general-settings'] = section['general-settings'];

            loadFiltersSection((section) => {
                result['filters'] = section['filters'];

                callback(result);
            });
        });
    };

    /**
     * Imports settings set from json format
     * @param {string} settingsJson
     */
    const applySettingsBackupJson = function (settingsJson) {
        function onFinished(success) {
            if (success) {
                log.info('Settings import finished successfully');
            } else {
                log.error('Error importing settings');
            }

            listeners.notifyListeners(events.SETTINGS_UPDATED, { success });
        }

        let input = null;

        try {
            input = JSON.parse(settingsJson);
        } catch (error) {
            log.error(`Error parsing input json ${settingsJson}, ${error}`);
            onFinished(false);
            return;
        }

        if (!input || input['protocol-version'] !== BACKUP_PROTOCOL_VERSION) {
            log.error(`Json input is invalid ${settingsJson}`);
            onFinished(false);
            return;
        }

        applyGeneralSettingsSection(input, (success) => {
            if (!success) {
                onFinished(false);
                return;
            }

            applyFiltersSection(input, (success) => {
                onFinished(success);
            });
        });
    };

    return {
        loadSettingsBackup: loadSettingsBackupJson,
        applySettingsBackup: applySettingsBackupJson
    };

})();

