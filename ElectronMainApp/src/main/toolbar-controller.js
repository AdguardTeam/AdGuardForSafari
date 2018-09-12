const safariToolbar = require('safari-ext');
const applicationApi = require('./api');
const listeners = require('./notifier');
const events = require('./events');
const log = require('./app/utils/log');

/**
 * Addon toolbar controller.
 * Handles safari-ext events and setups its view state.
 */
module.exports = (() => {

    /**
     * Protection status has been changed from toolbar
     *
     * @param isEnabled
     */
    const onProtectionChangedCallback = (isEnabled) => {
        log.debug('Protection status changed: {0}', isEnabled);

        if (isEnabled) {
            applicationApi.start();
        } else {
            applicationApi.pause();
        }
    };

    /**
     * Whitelist has been changed from toolbar
     *
     */
    const onWhitelistChangedCallback = (domains) => {
        log.debug('Whitelist changed: {0}', domains);

        applicationApi.setWhitelist(domains);
    };

    /**
     * User filter rules have been changed from toolbar
     */
    const onUserFilterChangedCallback = (rules) => {
        log.debug('User filter changed: {0}', rules);

        applicationApi.setUserFilterRules(rules);
    };

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.
     */
    const init = () => {

        log.debug('Initializing toolbar controller..');

        //Subscribe to toolbar events
        safariToolbar.init(onProtectionChangedCallback, onWhitelistChangedCallback, onUserFilterChangedCallback);

        //Subscribe to application events
        listeners.addListener(function (event, info) {
            if (event === events.CONTENT_BLOCKER_UPDATE_REQUIRED) {
                setContentBlockingJson(JSON.stringify(info));
            } else if (event === events.UPDATE_USER_FILTER_RULES) {
                applicationApi.getUserFilterRules((rules) => {
                    setUserFilter(rules);
                });
            } else if (event === events.UPDATE_WHITELIST_FILTER_RULES) {
                setWhitelistDomains(applicationApi.getWhitelist());
            }
        });

        setProtectionEnabled(true);

        log.debug('Initializing toolbar controller ok.');
    };

    /**
     * Sets content blocker json
     */
    const setContentBlockingJson = (jsonString) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setContentBlockingJson(jsonString, (result) => {
            log.info('Content-blocker set result: ' + result);

            safariToolbar.busyStatus(false);
        });

    };

    /**
     * Sets protection status
     */
    const setProtectionEnabled = (isEnabled) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setProtectionEnabled(isEnabled);
        safariToolbar.busyStatus(false);
    };

    /**
     * Sets whitelisted domains
     */
    const setWhitelistDomains = (domains) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setWhitelistDomains(domains, () => {
            safariToolbar.busyStatus(false);
        });
    };

    /**
     * Sets user filter rules
     */
    const setUserFilter = (rules) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setUserFilter(rules, () => {
            safariToolbar.busyStatus(false);
        });
    };

    return {
        init: init
    };

})();