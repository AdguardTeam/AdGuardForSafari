const config = require('config');
const allowlist = require('./app/allowlist');
const userrules = require('./app/userrules');
const antibanner = require('./app/antibanner');
const log = require('./app/utils/log');
const filtersManager = require('./app/filters-manager');

const { CUSTOM_FILTERS_GROUP_ID } = config.get('AntiBannerFilterGroupsId');

/**
 * Api
 */
module.exports = (() => {
    /**
     * Returns toolbar data for url
     *
     * @param {String} url
     * @returns {{applicationFilteringDisabled: boolean, urlFilteringDisabled: boolean, isAllowlisted: boolean}}
     */
    const getToolbarMenuData = (url) => {
        const urlFilteringDisabled = !url || url.indexOf('http') !== 0;
        const applicationFilteringDisabled = antibanner.isRunning();
        let isAllowlisted = false;

        if (!urlFilteringDisabled) {
            isAllowlisted = allowlist.isAllowlisted(url);
        }

        return {
            applicationFilteringDisabled,
            urlFilteringDisabled,

            isAllowlisted,
        };
    };

    /**
     * Enables protection for url domain
     *
     * @param {String} url
     */
    const enable = (url) => {
        allowlist.unAllowlistUrl(url);

        log.info(`Url removed from allowlist: ${url}`);
    };

    /**
     * Disables protection for url domain
     *
     * @param {String} url
     */
    const disable = (url) => {
        allowlist.allowlistUrl(url);

        log.info(`Url added to allowlist: ${url}`);
    };

    /**
     * Is protection running
     *
     * @return {boolean}
     */
    const isProtectionRunning = () => {
        return antibanner.isRunning();
    };

    /**
     * Pauses protection
     */
    const pause = () => {
        if (!isProtectionRunning()) {
            return;
        }

        antibanner.stop();

        log.info('Protection paused');
    };

    /**
     * Starts protection
     */
    const start = () => {
        if (isProtectionRunning()) {
            return;
        }

        antibanner.start({}, () => {
            log.info('Protection started');
        });
    };

    /**
     * Sets user filter rules
     *
     * @param {Array} rules
     */
    const setUserFilterRules = (rules) => {
        userrules.updateUserRulesText(rules.join('\n'));

        log.info('User filter rules updated');
    };

    /**
     * Sets allowlist domains
     *
     * @param {Array} domains
     */
    const setAllowlist = (domains) => {
        allowlist.updateAllowlistDomains(domains);

        log.info('allowlist updated');
    };

    /**
     * Returns allowlisted domains
     */
    const getAllowlist = () => {
        return allowlist.getAllowlistDomains();
    };

    /**
     * Returns user filter rules
     */
    const getUserFilterRules = (callback) => {
        userrules.getUserRulesText((result) => {
            callback(result ? result.split('\n') : []);
        });
    };

    /**
     * Return array of enabled filters identifiers
     */
    const getEnabledFilterIds = () => {
        const filters = filtersManager.getFilters();
        const enabledFilters = [];
        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            if (filter.enabled) {
                if (filtersManager.isGroupEnabled(filter.groupId)) {
                    enabledFilters.push(filter.filterId);
                }
            }
        }

        return enabledFilters;
    };

    /**
     * Return array of enabled custom filters urls
     */
    const getEnabledCustomFiltersUrls = () => {
        if (!filtersManager.isGroupEnabled(CUSTOM_FILTERS_GROUP_ID)) {
            return;
        }
        const customFilters = filtersManager.getCustomFilters();
        const enabledCustomFiltersUrls = [];
        for (let i = 0; i < customFilters.length; i += 1) {
            const filter = customFilters[i];
            if (filter.enabled) {
                enabledCustomFiltersUrls.push(filter.customUrl);
            }
        }

        if (!enabledCustomFiltersUrls.length) {
            return;
        }

        return enabledCustomFiltersUrls;
    };

    return {
        getToolbarMenuData,
        enable,
        disable,
        isProtectionRunning,
        pause,
        start,
        setAllowlist,
        getAllowlist,
        setUserFilterRules,
        getUserFilterRules,
        getEnabledFilterIds,
        getEnabledCustomFiltersUrls,
    };
})();
