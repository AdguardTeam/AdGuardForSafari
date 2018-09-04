const safari = require('safari-ext');

/**
 * Addon toolbar controller
 */
module.exports = (() => {

    /**
     * Initializes toolbar controller
     * Adds toolbar events listener and reacts on them.
     */
    const init = () => {
        //TODO: Implement
    };

    /**
     * Sets protection status
     */
    const setProtectionEnabled = (isEnabled) => {
        //safari.setProtectionEnabled(isEnabled);
    };

    return {
        init: init,
        setProtectionEnabled: setProtectionEnabled
    };

})();