const whitelist = require('./app/whitelist');
const userrules = require('./app/userrules');
const antibanner = require('./app/antibanner');
const log = require('./app/utils/log');
const filtersManager = require('./app/filters-manager');

/**
 * Api
 */
module.exports = (() => {
    /**
     * Returns toolbar data for url
     *
     * @param {String} url
     * @returns {{applicationFilteringDisabled: boolean, urlFilteringDisabled: boolean, isWhitelisted: boolean}}
     */
    const getToolbarMenuData = (url) => {
        const urlFilteringDisabled = !url || url.indexOf('http') !== 0;
        const applicationFilteringDisabled = antibanner.isRunning();
        let isWhitelisted = false;

        if (!urlFilteringDisabled) {
            isWhitelisted = whitelist.isWhitelisted(url);
        }

        return {
            applicationFilteringDisabled,
            urlFilteringDisabled,

            isWhitelisted,
        };
    };

    /**
     * Enables protection for url domain
     *
     * @param {String} url
     */
    const enable = (url) => {
        whitelist.unWhiteListUrl(url);

        log.info(`Url removed from whitelist: ${url}`);
    };

    /**
     * Disables protection for url domain
     *
     * @param {String} url
     */
    const disable = (url) => {
        whitelist.whiteListUrl(url);

        log.info(`Url added to whitelist: ${url}`);
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
     * Sets whitelist domains
     *
     * @param {Array} domains
     */
    const setWhitelist = (domains) => {
        whitelist.updateWhiteListDomains(domains);

        log.info('Whitelist updated');
    };

    /**
     * Returns whitelisted domains
     */
    const getWhitelist = () => {
        return whitelist.getWhiteListDomains();
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

    return {
        getToolbarMenuData,
        enable,
        disable,
        isProtectionRunning,
        pause,
        start,
        setWhitelist,
        getWhitelist,
        setUserFilterRules,
        getUserFilterRules,
        getEnabledFilterIds,
    };
})();
