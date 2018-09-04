const whitelist = require('./app/whitelist');
const userrules = require('./app/userrules');
const antibanner = require('./app/antibanner');
const log = require('./app/utils/log');

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
            applicationFilteringDisabled: applicationFilteringDisabled,
            urlFilteringDisabled: urlFilteringDisabled,

            isWhitelisted: isWhitelisted
        }
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
     * Pauses protection
     */
    const pause = () => {
        antibanner.stop();

        log.info('Protection paused');
    };

    /**
     * Starts protection
     */
    const start = () => {
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
    const getUserFilterRules = () => {
        return userrules.getUserRulesText().split('\r\n');
    };

    return {
        getToolbarMenuData: getToolbarMenuData,
        enable: enable,
        disable: disable,
        pause: pause,
        start: start,
        setWhitelist: setWhitelist,
        getWhitelist: getWhitelist,
        setUserFilterRules: setUserFilterRules,
        getUserFilterRules: getUserFilterRules
    };

})();