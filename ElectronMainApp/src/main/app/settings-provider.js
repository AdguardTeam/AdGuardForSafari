const config = require('config');
const filters = require('./filters-manager');
const cache = require('./filters/cache');
const customFilters = require('./filters/custom-filters');
const app = require('./app');
const settingsManager = require('./settings-manager');
const userRules = require('./userrules');
const allowlist = require('./allowlist');
const log = require('./utils/log');
const listeners = require('../notifier');
const events = require('../events');

/**
 * Application settings provider.
 */
module.exports = (() => {
    const BACKUP_PROTOCOL_VERSION = '1.0';

    /**
     * Collect enabled filters ids without custom filters
     * @returns {Array}
     */
    const collectEnabledFilterIds = () => {
        const enabledFilters = filters.getFilters();
        return enabledFilters
            .filter((filter) => !filter.customUrl && filter.enabled)
            .map((filter) => filter.filterId);
    };

    /**
     * Collects data about added custom filters to the extension
     * @returns {CustomFilterInitial} - returns data enough to import custom filter
     */
    const collectCustomFiltersData = () => {
        const customFilters = filters.getCustomFilters();
        return customFilters.map((filter) => ({
            filterId: filter.filterId,
            customUrl: filter.customUrl,
            enabled: filter.enabled,
            title: filter.name || '',
            trusted: filter.trusted,
        }));
    };

    const collectEnabledGroupIds = () => {
        const groups = cache.getGroups();
        return groups
            .filter((group) => group.enabled)
            .map((group) => group.groupId);
    };

    /**
     * Loads filters settings section
     * @param callback
     */
    const loadFiltersSection = (callback) => {
        const enabledFilterIds = collectEnabledFilterIds();
        const enabledGroupIds = collectEnabledGroupIds();
        const customFiltersData = collectCustomFiltersData();

        // Collect allowlist/blocklist domains and allowlist mode
        const allowlistDomains = allowlist.getAllowlistedDomains() || [];
        const blockListDomains = allowlist.getBlocklistedDomains() || [];
        const defaultAllowlistMode = !!allowlist.isDefaultMode();
        const allowlistEnabled = !!settingsManager.isAllowlistEnabled();
        const userFilterEnabled = !!settingsManager.isUserrulesEnabled();

        // Collect user rules
        userRules.getUserRules((content) => {
            const section = {
                'filters': {
                    'enabled-groups': enabledGroupIds,
                    'enabled-filters': enabledFilterIds,
                    'custom-filters': customFiltersData,
                    'user-filter': {
                        'enabled': userFilterEnabled,
                        'rules': content.join('\n'),
                        'disabled-rules': '',
                    },
                    'allowlist': {
                        'enabled': allowlistEnabled,
                        'inverted': !defaultAllowlistMode,
                        'domains': allowlistDomains,
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
        const allowAcceptableAds = enabledFilterIds
            .indexOf(config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID) >= 0;

        const section = {
            'general-settings': {
                'app-language': app.getLocale(),
                'allow-acceptable-ads': allowAcceptableAds,
                'show-app-updated-disabled': !settingsManager.isShowAppUpdatedNotification(),
                'update-filters-period': settingsManager.getUpdateFiltersPeriod(),
                'show-tray-icon': settingsManager.isShowTrayIconEnabled(),
                'launch-at-login': settingsManager.isLaunchAtLoginEnabled(),
                'verbose-logging': settingsManager.isVerboseLoggingEnabled(),
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
        settingsManager.changeShowTrayIcon(set['show-tray-icon']);
        settingsManager.changeLaunchAtLogin(set['launch-at-login']);
        settingsManager.changeVerboseLogging(set['verbose-logging']);
        settingsManager.changeHardwareAcceleration(set['hardware-acceleration-disabled']);

        if (set['allow-acceptable-ads']) {
            filters.addAndEnableFilters([config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID]);
        } else {
            filters.disableFilters([config.get('AntiBannerFiltersId').SEARCH_AND_SELF_PROMO_FILTER_ID]);
        }
        settingsManager.changeAllowAcceptableAds(set['allow-acceptable-ads']);

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
     * Enables filters by filterId and disables those filters which were not in the list of enabled filters
     * @param {array<number>} filterIds - ids to enable
     */
    const syncEnabledFilters = (filterIds) => {
        filters.addAndEnableFilters(filterIds);
        const enabledFilters = filters.getEnabledFilters();
        const filtersToDisable = enabledFilters
            .filter((enabledFilter) => !filterIds.includes(enabledFilter.filterId))
            .map((filter) => filter.filterId);
        filters.disableFilters(filtersToDisable);
    };

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
        const groups = cache.getGroups();

        const groupIdsToDisable = groups
            .map((group) => group.groupId)
            .filter((groupId) => !enabledGroups.includes(groupId - 0));
        groupIdsToDisable.forEach((groupId) => {
            filters.disableGroup(groupId);
        });
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyFiltersSection = async (section, callback) => {
        // TODO remove whitelist later
        const allowlistSection = section.filters['allowlist'] || section.filters['whitelist'] || {};
        const allowlistEnabled = !!allowlistSection.enabled;
        const allowlistDomains = allowlistSection.domains || [];
        const blocklistDomains = allowlistSection['inverted-domains'] || [];

        // Apply allowlist/blocklist domains and allowlist mode
        settingsManager.changeAllowlistState(allowlistEnabled);
        allowlist.configure(allowlistDomains, blocklistDomains, !allowlistSection.inverted);
        settingsManager.updateDefaultAllowlistMode(!allowlistSection.inverted);

        const userFilterSection = section.filters['user-filter'] || {};
        const userFilterEnabled = !!userFilterSection.enabled;
        const userRulesData = userFilterSection.rules || '';

        // Apply user rules
        userRules.updateUserRulesText(userRulesData);
        settingsManager.changeUserrulesState(userFilterEnabled);

        // Apply custom filters
        const customFiltersData = section.filters['custom-filters'] || [];

        customFiltersData.forEach((customFilter) => {
            if (!customFilter.customUrl) {
                throw new Error(`Custom filter should always have custom URL: ${JSON.stringify(customFilter)}`);
            }
            customFilters.addCustomFilter(
                customFilter.customUrl,
                { title: customFilter.name, trusted: customFilter.trusted },
                (filterId) => {
                    if (filterId) {
                        log.info(`Added custom filter: ${filterId}`);
                        if (customFilter.enabled) {
                            filters.addAndEnableFilters([filterId]);
                        } else {
                            filters.disableFilters([filterId]);
                        }
                    }
                }
            );
        });

        // Sync enabled filters
        const enabledFilterIds = section.filters['enabled-filters'] || [];
        syncEnabledFilters([...enabledFilterIds]);

        // Sync enabled groups
        const enabledGroups = section.filters['enabled-groups'] || [];
        syncEnabledGroups(enabledGroups);
        callback(true);
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
        applySettingsBackup: applySettingsBackupJson,
    };
})();
