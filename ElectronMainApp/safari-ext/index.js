const addon = require('bindings')('safari_ext_addon');

/**
 * Addon toolbar api
 *
 * Before any `set` operations we need call `busyStatus(true)`,
 * and after all changes we need call `busyStatus(false)`.
 * Like begin/end transaction.
 */
module.exports = (() => {

    const ADVANCED_BLOCKING_BUNDLE_ID = "com.adguard.safari.AdGuard.AdvancedBlocking";
    const ICON_EXTENSION_BUNDLE_ID = "com.adguard.safari.AdGuard.Extension";

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
            })
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
        if (bundleId === "com.adguard.safari.AdGuard.AdvancedBlocking") {
            addon.setAdvancedBlockingJson(jsonString, callback);
        } else {
            addon.setContentBlockingJson(bundleId, jsonString, callback);
        }
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
    * Launches Safari and opens the preferences panel for a desabled extension.
    * @param callback = (result as bool) => {}
    */
    const openExtensionsPreferenses = (callback) => {
        addon.openExtensionsPreferenses(callback);
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
        openExtensionsPreferenses: openExtensionsPreferenses,
        debugLog: debugLog,
        setVerboseLogging: setVerboseLogging
    };

})();
