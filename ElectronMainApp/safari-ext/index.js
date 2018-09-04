const addon = require('bindings')('safari_ext_addon')

/**
 * Addon toolbar controller

 Before any `set` operations we need call `busyStatus(true)`, 
 and after all changes we need call `busyStatus(false)`. 
 Like begin/end transaction. 
 */
module.exports = (() => {

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.

        onProtectionChangedCallback  = (bool) => {}
        onWhitelistChangedCallback = (stringArray) => {}
        onUserFilterChangedCallback = (stringArray) => {}

     */
    const init = (onProtectionChangedCallback, onWhitelistChangedCallback, onUserFilterChangedCallback) => {
        if (onProtectionChangedCallback) {        
                addon.setOnProtectionEnabled(()=>{
                onProtectionChangedCallback(addon.protectionEnabled());
            });
        }

        if (onWhitelistChangedCallback) {        
            addon.setOnWhitelist(()=>{
                addon.whitelistDomains(onWhitelistChangedCallback);
            });
        }
        if (onUserFilterChangedCallback) {
            addon.setOnUserFilter(()=>{
                addon.userfilter(onUserFilterChangedCallback);
            });
        }

        busyStatus(false);
    };


    const busyStatus = (busy) => {

        addon.setBusy(busy);
    };

    /**

        jsonString - string with content blocking json
        callback = () => {}
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
        domains - string array
        callback = () => {}
    */
    const setWhitelistDomains = (domains, callback) => {
        addon.setWhitelistDomains(domains, callback);
    };

    /**
        rules - string array
        callback = () => {}
    */
    const setUserFilter= (rules, callback) => {
        addon.setUserfilter(rules, callback);
    };

    return {
        init: init,
        busyStatus: busyStatus,
        setContentBlockingJson: setContentBlockingJson,
        setProtectionEnabled: setProtectionEnabled,
        setWhitelistDomains: setWhitelistDomains,
        setUserFilter: setUserFilter
    };

})();
