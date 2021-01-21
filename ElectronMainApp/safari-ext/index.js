/* eslint-disable object-shorthand */
const addon = require('bindings')('safari_ext_addon');

/**
 * Addon toolbar api
 *
 * Before any `set` operations we need call `busyStatus(true)`,
 * and after all changes we need call `busyStatus(false)`.
 * Like begin/end transaction.
 */
module.exports = (() => {
    const ADVANCED_BLOCKING_BUNDLE_ID = 'com.adguard.safari.AdGuard.AdvancedBlocking';
    const ICON_EXTENSION_BUNDLE_ID = 'com.adguard.safari.AdGuard.Extension';

    const queue = [];
    let queueInProcess = false;

    /**
     * Initializes toolbar
     *
     * @param onProtectionChangedCallback  = (bool) => {}
     * @param onWhitelistChangedCallback = (stringArray) => {}
     * @param onUserFilterChangedCallback = (stringArray) => {}
     * @param onShowPreferencesCallback = () => ()
     * @param onReportCallback = (string) => ()
     */
    const init = (
        onProtectionChangedCallback,
        onWhitelistChangedCallback,
        onUserFilterChangedCallback,
        onShowPreferencesCallback,
        onReportCallback
    ) => {
        if (onProtectionChangedCallback) {
            addon.setOnProtectionEnabled(() => {
                onProtectionChangedCallback(addon.protectionEnabled());
            });
        }

        if (onWhitelistChangedCallback) {
            addon.setOnWhitelist(() => {
                addon.whitelistDomains(onWhitelistChangedCallback);
            });
        }
        if (onUserFilterChangedCallback) {
            addon.setOnUserFilter(() => {
                addon.userFilter(onUserFilterChangedCallback);
            });
        }

        if (onShowPreferencesCallback) {
            addon.setOnShowPreferences(() => {
                onShowPreferencesCallback();
            });
        }

        if (onReportCallback) {
            addon.setOnReport(() => {
                onReportCallback(addon.reportUrl());
            });
        }

        busyStatus(false);
    };

    const sendReady = () => {
        addon.sendReady();
    };

    /**
     * Sets busy status
     *
     * @param busy
     */
    const busyStatus = (busy) => {
        addon.setBusy(busy);
    };

    /**
     * Sets content blocker json
     *
     * @param bundleId - string extension bundle identifier
     * @param jsonString - string with content blocking json
     * @param callback = (result) => {}
     * result contains json string with two types of a values:
     * {"result":"success"}
     * {"result":"error", "error":{"domain":"ErrorDomain", "code":100, "descr":"Error Description IF Available"}}
     */
    const setContentBlockingJson = (bundleId, jsonString, callback) => {
        queue.push({
            bundleId,
            jsonString,
            callback,
        });

        // Note that we're calling it without await here
        // So that it was called asynchronously
        processQueue();
    };

    /**
     * Async sets content blocker json
     *
     * @param bundleId
     * @param jsonString
     * @return {Promise<unknown>}
     */
    const setContentBlockingJsonAsync = async (bundleId, jsonString) => {
        return new Promise((resolve, reject) => {
            try {
                if (bundleId === ADVANCED_BLOCKING_BUNDLE_ID) {
                    addon.setAdvancedBlockingJson(jsonString, (result) => {
                        resolve(result);
                    });
                } else {
                    addon.setContentBlockingJson(bundleId, jsonString, (result) => {
                        resolve(result);
                    });
                }
            } catch (ex) {
                reject(ex);
            }
        });
    };

    /**
     * Starts processing queue
     *
     * @return {Promise<void>}
     */
    const processQueue = async () => {
        if (queueInProcess) {
            return;
        }

        queueInProcess = true;

        // Schedule async queue processing
        while (queue.length > 0) {
            const item = queue.shift();
            try {
                // eslint-disable-next-line no-await-in-loop
                const result = await setContentBlockingJsonAsync(item.bundleId, item.jsonString);
                item.callback(result);
            } catch (ex) {
                // Ignore
            }
        }

        queueInProcess = false;
    };

    /**
     * Sets protection status
     */
    const setProtectionEnabled = (isEnabled) => {
        addon.setProtectionEnabled(isEnabled);
    };

    /**
    * Gets protection status
    * @return Returns boolean value.
    */
    const protectionEnabled = () => {
        return addon.protectionEnabled();
    };

    /**
     * @param domains - string array
     * @param callback = () => {}
     */
    const setWhitelistDomains = (domains, callback) => {
        addon.setWhitelistDomains(domains, callback);
    };

    /**
     * @param callback = (domains as stringArray) => {}
     */
    const whitelistDomains = (callback) => {
        addon.whitelistDomains(callback);
    };

    /**
     * @param rules - string array
     * @param callback = () => {}
     */
    const setUserFilter = (rules, callback) => {
        addon.setUserFilter(rules, callback);
    };
    /**
     * @param callback = (rules as stringArray) => {}
     */
    const userFilter = (callback) => {
        addon.userFilter(callback);
    };

    /**
     * Get safari extensions states info
     * @param bundleId extension bundle identifier
     * @param callback {*}
     */
    const getExtensionState = (bundleId, callback) => {
        if (bundleId === ADVANCED_BLOCKING_BUNDLE_ID) {
            addon.extensionAdvancedBlockingState(callback);
        } else if (bundleId === ICON_EXTENSION_BUNDLE_ID) {
            addon.extensionSafariIconState(callback);
        } else {
            addon.getExtensionContentBlockerState(bundleId, callback);
        }
    };

    /**
    * Launches Safari and opens the preferences panel for a disabled extension.
    * @param callback = (result as bool) => {}
    */
    const openExtensionsPreferences = (callback) => {
        addon.openExtensionsPreferences(callback);
    };

    const debugLog = (msg) => {
        addon.debugLog(msg);
    };

    /**
     * Sets verbose logging
     *
     * @param enabled
     */
    const setVerboseLogging = (enabled) => {
        addon.setVerboseLogging(enabled);
    };

    /**
     * Sets Start at user login
     * After a long story with electron login items API, we decided to move to our own Login Helper app,
     * so this method sets up a flag to start at login or not.
     *
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/204
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/265
     *
     */
    const setStartAtLogin = (isEnabled) => {
        addon.setStartAtLogin(isEnabled);
    };

    /**
     * Gets status of the "Start at user login"
     *
     * @return Returns boolean value.
     */
    const startAtLogin = () => {
        return addon.startAtLogin();
    };

    /**
     * Removes electron app login item, see details:
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/293
     *
     * @param callback = (result as bool) => {}
     */
    const removeOldLoginItem = (callback) => {
        addon.removeOldLoginItem(callback);
    };

    /**
     * Initiates request for MAS user review
     */
    const requestMASUserReview = () => {
        addon.requestMASUserReview();
    };

    /**
     * Returns path to shared resources folder (App Group Folder)
     */
    const sharedResourcesPath = () => {
        return addon.sharedResourcesPath();
    };

    return {
        init: init,
        sendReady: sendReady,
        busyStatus: busyStatus,
        setContentBlockingJson: setContentBlockingJson,
        setProtectionEnabled: setProtectionEnabled,
        protectionEnabled: protectionEnabled,
        setWhitelistDomains: setWhitelistDomains,
        whitelistDomains: whitelistDomains,
        setUserFilter: setUserFilter,
        userFilter: userFilter,
        getExtensionState: getExtensionState,
        openExtensionsPreferences: openExtensionsPreferences,
        debugLog: debugLog,
        setVerboseLogging: setVerboseLogging,
        setStartAtLogin: setStartAtLogin,
        startAtLogin: startAtLogin,
        removeOldLoginItem: removeOldLoginItem,
        requestMASUserReview: requestMASUserReview,
        sharedResourcesPath: sharedResourcesPath,
    };
})();
