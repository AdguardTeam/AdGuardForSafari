const safariToolbar = require('safari-ext');
const applicationApi = require('./api');
const listeners = require('./notifier');
const events = require('./events');
const log = require('./app/utils/log');
const app = require('./app/app');
const {shell} = require('electron');

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

        listeners.notifyListeners(events.NOTIFY_UPDATE_USER_FILTER_RULES);
    };

    /**
     * Return callback function for show preferences event
     *
     * @param showWindow
     * @returns {*}
     */
    const onShowPreferencesCallback = (showWindow) => {
        log.debug('Show preferences callback');

        return showWindow;
    };

    /**
     * Opens site complaint report
     *
     * @param reportUrl
     */
    const onReportCallback = (reportUrl) => {
        const browser = 'Safari';
        const filters = applicationApi.getEnabledFilterIds();

        const url = "https://reports.adguard.com/new_issue.html?product_type=Ext&product_version=" + encodeURIComponent(app.getVersion()) +
            "&browser=" + encodeURIComponent(browser) +
            "&url=" + encodeURIComponent(reportUrl) +
            "&filters=" + encodeURIComponent(filters.join('.'));

        shell.openExternal(url);
    };

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.
     */
    const initToolbarController = (showWindow) => {

        log.debug('Initializing toolbar controller..');

        //Subscribe to toolbar events
        safariToolbar.init(onProtectionChangedCallback, onWhitelistChangedCallback,
            onUserFilterChangedCallback, onShowPreferencesCallback(showWindow),
            onReportCallback);

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
        initToolbarController
    };

})();