const config = require('config');
const safariToolbar = require('safari-ext');
const applicationApi = require('./api');
const listeners = require('./notifier');
const events = require('./events');
const settings = require('./app/settings-manager');
const log = require('./app/utils/log');
const app = require('./app/app');
const { shell } = require('electron');

/**
 * Addon toolbar controller.
 * Handles safari-ext events and setups its view state.
 */
module.exports = (() => {

    const SafariExtensionBundles = config.get('SafariExtensionBundles');
    const ContentBlockerExtensions = [
        SafariExtensionBundles.GENERAL,
        SafariExtensionBundles.PRIVACY,
        SafariExtensionBundles.SOCIAL_WIDGETS_AND_ANNOYANCES,
        SafariExtensionBundles.SECURITY,
        SafariExtensionBundles.OTHER,
        SafariExtensionBundles.CUSTOM
    ];

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

        let newRule = rules[rules.length - 1];
        listeners.notifyListeners(events.NOTIFY_UPDATE_USER_FILTER_RULES, { newRule });
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

        // Subscribe to toolbar events
        safariToolbar.init(onProtectionChangedCallback, onWhitelistChangedCallback,
            onUserFilterChangedCallback, onShowPreferencesCallback(showWindow),
            onReportCallback);

        // Subscribe to application events
        listeners.addListener(function (event, info) {
            if (event === events.CONTENT_BLOCKER_UPDATE_REQUIRED) {
                setContentBlockingJson(info.bundleId, info.json, info.info);
            } else if (event === events.UPDATE_USER_FILTER_RULES) {
                applicationApi.getUserFilterRules((rules) => {
                    setUserFilter(rules);
                });
            } else if (event === events.UPDATE_WHITELIST_FILTER_RULES) {
                setWhitelistDomains(applicationApi.getWhitelist());
            } else if (event === events.PROTECTION_STATUS_CHANGED) {
                setProtectionEnabled(!!info);
            }
        });

        settings.onUpdated.addListener(function (setting) {
            if (setting === settings.VERBOSE_LOGGING) {
                setVerboseLogging(settings.isVerboseLoggingEnabled());
            }
        });

        setProtectionEnabled(true);

        log.debug('Initializing toolbar controller ok.');
    };

    /**
     * Sets content blocker json
     */
    const setContentBlockingJson = (bundleId, jsonString, info) => {
        safariToolbar.busyStatus(true);
        log.info(`Content-blocker updating ${bundleId}`);
        safariToolbar.setContentBlockingJson(bundleId, jsonString, (result) => {
            log.info(`Content-blocker ${bundleId} set result : ${result}`);

            if (info) {
                if (parseError(result)) {
                    info.hasError = true;
                }

                listeners.notifyListeners(events.CONTENT_BLOCKER_EXTENSION_UPDATED, info);
            }

            setTimeout(() => {
                safariToolbar.busyStatus(false);
            }, 1000);
        });
    };

    /**
     * Checks if result contains error
     *
     * @param info
     * @return {boolean}
     */
    const parseError = (info) => {
        if (info) {
            return info.indexOf('"result":"error"') >= 0;
        }

        return false;
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
            //Do nothing, we wait for CONTENT_BLOCKER_UPDATE_REQUIRED event to set busy off
        });
    };

    /**
     * Sets user filter rules
     */
    const setUserFilter = (rules) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setUserFilter(rules, () => {
            //Do nothing, we wait for CONTENT_BLOCKER_UPDATE_REQUIRED event to set busy off
        });
    };

    /**
     * Get safari extensions states info
     * @param callback {*}
     */
    const getExtensionsState = (callback) => {
        const dfds = [];
        const extensions = {};

        for (let bundle in SafariExtensionBundles) {
            const bundleId = SafariExtensionBundles[bundle];
            dfds.push(new Promise((resolve) => {
                safariToolbar.getExtensionState(bundleId, (info) => {
                    extensions[bundleId] = info;
                    resolve();
                });
            }));
        }

        Promise.all(dfds).then(function () {
            let allContentBlockersDisabled = true;
            let contentBlockersEnabled = true;
            let minorExtensionsEnabled = true;
            let enabledContentBlockersCount = 0;

            for (let extension in extensions) {
                const extensionEnabled = extensions[extension];
                if (!extensionEnabled) {
                    if (ContentBlockerExtensions.indexOf(extension) >= 0) {
                        contentBlockersEnabled = false;
                    } else {
                        minorExtensionsEnabled = false;
                    }
                } else {
                    if (ContentBlockerExtensions.indexOf(extension) >= 0) {
                        enabledContentBlockersCount++;
                        allContentBlockersDisabled = false;
                    }
                }
            }

            const result = {
                extensions,
                contentBlockersEnabled,
                minorExtensionsEnabled,
                allContentBlockersDisabled,
                enabledContentBlockersCount,
            };

            callback(result);
        });
    };

    /**
     * Sets verbose logging
     *
     * @param enabled
     */
    const setVerboseLogging = (enabled) => {
        safariToolbar.setVerboseLogging(enabled);
    };

    return {
        initToolbarController,
        getExtensionsState
    };

})();