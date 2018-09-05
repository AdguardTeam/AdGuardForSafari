const addon = require('bindings')('safari_ext_addon')

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
     */
    const init = (onProtectionChangedCallback, onWhitelistChangedCallback, onUserFilterChangedCallback) => {
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
                addon.userfilter(onUserFilterChangedCallback);
            });
        }

        busyStatus(false);
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
     * Sets protection status
     */
    const setProtectionEnabled = (isEnabled) => {
        addon.setProtectionEnabled(isEnabled);
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
        addon.setUserfilter(rules, callback);
    };
    /**
     * @param callback = (rules as stringArray) => {}
     */
    const userFilter = (callback) => {
        addon.userFilter(callback);
    };

    return {
        init: init,
        busyStatus: busyStatus,
        setContentBlockingJson: setContentBlockingJson,
        setProtectionEnabled: setProtectionEnabled,
        setWhitelistDomains: setWhitelistDomains,
        setUserFilter: setUserFilter,
        userFilter: userFilter,
        whitelistDomains: whitelistDomains
    };

})();
