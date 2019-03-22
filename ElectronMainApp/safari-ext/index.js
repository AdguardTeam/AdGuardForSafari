const addon = require('bindings')('safari_ext_addon');

/**
 * Addon toolbar api
 *
 * Before any `set` operations we need call `busyStatus(true)`,
 * and after all changes we need call `busyStatus(false)`.
 * Like begin/end transaction.
 */
module.exports = (() => {

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
     * @param jsonString - string with content blocking json
     * @param callback = (result) => {}
     * result contains json string with two types of a values:
     * {"result":"success"}
     * {"result":"error", "error":{"domain":"ErrorDomain", "code":100, "descr":"Error Description IF Available"}}
     */
    const setContentBlockingJson = (jsonString, callback) => {
        addon.setContentBlockingJson(jsonString, callback);
    };

    /**
     * Sets advanced blocking json
     *
     * @param jsonString - string with content blocking json
     * @param callback = (result) => {}
     * result contains json string with two types of a values:
     * {"result":"success"}
     * {"result":"error", "error":{"domain":"ErrorDomain", "code":100, "descr":"Error Description IF Available"}}
     */
    const setAdvancedBlockingJson = (jsonString, callback) => {
        addon.setAdvancedBlockingJson(jsonString, callback);
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
    * Getting state of the content blocker extension.
    * Returns true in callback if extension enabled, else returns false.
    * @param callback = (enabled as bool) => {}
    */
    const extensionContentBlockerState = (callback) => {
        addon.extensionContentBlockerState(callback);
    };

    /**
    * Getting state of the icon of Safari app extension.
    * Returns true in callback if extension enabled, else returns false.
    * @param callback = (enabled as bool) => {}
    */
    const extensionSafariIconState = (callback) => {
        addon.extensionSafariIconState(callback);
    };

    /**
     * Getting state of Advanced Blocking Safari extension.
     * Returns true in callback if extension enabled, else returns false.
     * @param callback = (enabled as bool) => {}
     */
    const extensionAdvancedBlockingState = (callback) => {
        addon.extensionAdvancedBlockingState(callback);
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

    return {
        init: init,
        sendReady: sendReady,
        busyStatus: busyStatus,
        setContentBlockingJson: setContentBlockingJson,
        setAdvancedBlockingJson: setAdvancedBlockingJson,
        setProtectionEnabled: setProtectionEnabled,
        protectionEnabled: protectionEnabled,
        setWhitelistDomains: setWhitelistDomains,
        whitelistDomains: whitelistDomains,
        setUserFilter: setUserFilter,
        userFilter: userFilter,
        extensionContentBlockerState: extensionContentBlockerState,
        extensionSafariIconState: extensionSafariIconState,
        extensionAdvancedBlockingState: extensionAdvancedBlockingState,
        openExtensionsPreferenses: openExtensionsPreferenses,
        debugLog: debugLog
    };

})();
