const safariToolbar = require('safari-ext');
const applicationApi = require('./api');
const listeners = require('./notifier');
const events = require('./events');

/**
 * Addon toolbar controller
 */
module.exports = (() => {

    /**
     * Protection status has been changed from toolbar
     *
     * @param isEnabled
     */
    const onProtectionChangedCallback = (isEnabled) => {
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
        applicationApi.setWhitelist(domains);
    };

    /**
     * User filter rules have been changed from toolbar
     */
    const onUserFilterChangedCallback = (rules) => {
        applicationApi.setUserFilterRules(rules);
    };

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.
     */
    const init = () => {

        //Subscribe to toolbar events
        safariToolbar.init(onProtectionChangedCallback, onWhitelistChangedCallback, onUserFilterChangedCallback);

        //Subscribe to application events
        listeners.addListener(function (event, info) {
            if (event === events.CONTENT_BLOCKER_UPDATE_REQUIRED) {
                setContentBlockingJson(JSON.stringify(info));
            } else if (event === events.UPDATE_USER_FILTER_RULES) {
                setUserFilter(applicationApi.getUserFilterRules());
            } else if (event === events.UPDATE_WHITELIST_FILTER_RULES) {
                setWhitelistDomains(applicationApi.getWhitelist());
            }
        });

        setProtectionEnabled(true);
    };

    /**
     * Sets content blocker json
     */
    const setContentBlockingJson = (jsonString, callback) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setContentBlockingJson(jsonString, callback);
        safariToolbar.busyStatus(false);
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
    const setWhitelistDomains = (domains, callback) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setWhitelistDomains(domains, callback);
        safariToolbar.busyStatus(false);
    };

    /**
     * Sets user filter rules
     */
    const setUserFilter = (rules, callback) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setUserFilter(rules, callback);
        safariToolbar.busyStatus(false);
    };

    return {
        init: init
    };

})();