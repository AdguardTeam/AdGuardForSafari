const config = require('config');
const safariToolbar = require('safari-ext');
const { shell } = require('electron');
const applicationApi = require('./api');
const listeners = require('./notifier');
const events = require('./events');
const settings = require('./app/settings-manager');
const log = require('./app/utils/log');
const app = require('./app/app');
const localStorage = require('./app/storage/storage');

// eslint-disable-next-line max-len
const REPORT_SAFARI_URL = 'https://link.adtidy.org/forward.html?action=report&from=toolbar&app=safari_extension&product_type=Saf';

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
        SafariExtensionBundles.CUSTOM,
    ];

    /**
     * Protection status has been changed from toolbar
     *
     * @param isEnabled
     */
    const onProtectionChangedCallback = (isEnabled) => {
        log.info('Protection status changed: {0}', isEnabled);

        if (isEnabled) {
            applicationApi.start();
        } else {
            applicationApi.pause();
        }
    };

    /**
     * Allowlist has been changed from toolbar
     *
     */
    const onAllowlistChangedCallback = (domains) => {
        log.debug('Allowlist changed: {0}', domains);

        applicationApi.setAllowlist(domains);
    };

    /**
     * User filter rules have been changed from toolbar
     */
    const onUserFilterChangedCallback = (rules) => {
        log.debug('User filter changed: {0}', rules);

        applicationApi.setUserFilterRules(rules);

        const newRule = rules[rules.length - 1];
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
        const customFilters = applicationApi.getEnabledCustomFiltersUrls();

        const url = `${REPORT_SAFARI_URL}`
            + `&product_version=${encodeURIComponent(app.getVersion())}`
            + `&browser=${encodeURIComponent(browser)}`
            + `&url=${encodeURIComponent(reportUrl)}`
            + `&filters=${encodeURIComponent(filters.join('.'))}`
            + `${customFilters ? `&custom_filters=${encodeURIComponent(customFilters.join())}` : ''}`;

        shell.openExternal(url);
    };

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.
     */
    const initToolbarController = (showWindow) => {
        log.debug('Initializing toolbar controller..');

        // Subscribe to toolbar events
        safariToolbar.init(onProtectionChangedCallback, onAllowlistChangedCallback,
            onUserFilterChangedCallback, onShowPreferencesCallback(showWindow),
            onReportCallback);

        // Subscribe to application events
        listeners.addListener((event, info) => {
            if (event === events.CONTENT_BLOCKER_UPDATE_REQUIRED) {
                setContentBlockingJson(info.bundleId, info.json, info.info);
            } else if (event === events.UPDATE_USER_FILTER_RULES) {
                applicationApi.getUserFilterRules((rules) => {
                    setUserFilter(rules);
                });
            } else if (event === events.UPDATE_ALLOWLIST_FILTER_RULES) {
                setAllowlistDomains(settings.isAllowlistEnabled() ? applicationApi.getAllowlist() : []);
            } else if (event === events.PROTECTION_STATUS_CHANGED) {
                setProtectionEnabled(!!info);
            }
        });

        // Set setting on native part
        setVerboseLogging(settings.isVerboseLoggingEnabled());
        // Set on setting update
        settings.onUpdated.addListener((setting) => {
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
        log.info(`Content-blocker updating ${bundleId}`);
        safariToolbar.setContentBlockingJson(bundleId, jsonString, (result) => {
            log.info(`Content-blocker ${bundleId} set result : ${result}`);

            if (!result) {
                return;
            }

            if (parseError(result)) {
                log.info(`Retry content-blocker updating ${bundleId}`);
                safariToolbar.setContentBlockingJson(bundleId, jsonString, (result) => {
                    if (!result) {
                        return;
                    }

                    // In some cases we need to retry
                    // https://github.com/AdguardTeam/AdGuardForSafari/issues/461
                    // https://github.com/AdguardTeam/AdGuardForSafari/issues/456
                    log.info(`Retry content-blocker ${bundleId} set result : ${result}`);

                    if (parseError(result)) {
                        if (info) {
                            info.hasError = true;
                        }
                    }

                    listeners.notifyListeners(events.CONTENT_BLOCKER_EXTENSION_UPDATED, info);
                });
            } else {
                listeners.notifyListeners(events.CONTENT_BLOCKER_EXTENSION_UPDATED, info);
            }
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
     * Sets allowlisted domains
     */
    const setAllowlistDomains = (domains) => {
        safariToolbar.busyStatus(true);
        safariToolbar.setAllowlistDomains(domains, () => {
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

    /**
     * Get safari extensions states info
     * @param callback {*}
     */
    const getExtensionsState = (callback) => {
        const dfds = [];
        const extensions = {};

        for (const bundle in SafariExtensionBundles) {
            const bundleId = SafariExtensionBundles[bundle];
            dfds.push(new Promise((resolve) => {
                safariToolbar.getExtensionState(bundleId, (info) => {
                    extensions[bundleId] = info;
                    resolve();
                });
            }));
        }

        Promise.all(dfds).then(() => {
            let allContentBlockersDisabled = true;
            let contentBlockersEnabled = true;
            let minorExtensionsEnabled = true;
            let enabledContentBlockersCount = 0;

            for (const extension in extensions) {
                const extensionEnabled = extensions[extension];
                if (!extensionEnabled) {
                    if (ContentBlockerExtensions.indexOf(extension) >= 0) {
                        contentBlockersEnabled = false;
                    } else {
                        minorExtensionsEnabled = false;
                    }
                } else if (ContentBlockerExtensions.indexOf(extension) >= 0) {
                    enabledContentBlockersCount += 1;
                    allContentBlockersDisabled = false;
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

    const FIRST_MAS_REVIEW_CHECK = 'first-mas-review-check';
    const LAST_MAS_REVIEW_CHECK = 'last-mas-review-check';

    const TIME_SINCE_FIRST_CHECK = 24 * 60 * 60 * 1000; // 24 hours
    const TIME_SINCE_LAST_CHECK = 3 * 24 * 60 * 60 * 1000; // 3 days

    /**
     * Time of first check for mas review
     *
     * @return {number}
     */
    const getFirstCheckDate = () => {
        if (localStorage.hasItem(FIRST_MAS_REVIEW_CHECK)) {
            return localStorage.getItem(FIRST_MAS_REVIEW_CHECK);
        }

        const check = Date.now();
        localStorage.setItem(FIRST_MAS_REVIEW_CHECK, check);
        return check;
    };

    /**
     * Time of last review check or now
     *
     * @return {number}
     */
    const getLastCheckDate = () => {
        if (localStorage.hasItem(LAST_MAS_REVIEW_CHECK)) {
            return localStorage.getItem(LAST_MAS_REVIEW_CHECK);
        }

        return 0;
    };

    /**
     * Initiates request for MAS review
     */
    const requestMASReview = () => {
        log.info('Start requesting user for MAS review..');

        if (app.getChannel() !== 'MAS') {
            // Only for MAS version
            return;
        }

        if (Date.now() - getFirstCheckDate() < TIME_SINCE_FIRST_CHECK) {
            // Some time should pass from install
            log.info('Some time should pass from install');
            return;
        }

        if (Date.now() - getLastCheckDate() < TIME_SINCE_LAST_CHECK) {
            // Some time passed from last request
            log.info('Some time passed from last request');
            return;
        }

        getExtensionsState((extensionsState) => {
            if (!extensionsState || !extensionsState.contentBlockersEnabled
                || !extensionsState.minorExtensionsEnabled) {
                // All extensions should be enabled
                log.info('All extensions should be enabled');
                return;
            }

            localStorage.setItem(LAST_MAS_REVIEW_CHECK, Date.now());

            log.info('Requesting user for MAS review..');
            safariToolbar.requestMASUserReview();
        });
    };

    return {
        initToolbarController,
        getExtensionsState,
        requestMASReview,
    };
})();
