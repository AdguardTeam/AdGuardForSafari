const whitelist = require('./lib/whitelist');

/**
 * Application
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = () => {
        whitelist.init();
    };

    /**
     * Application locale
     * TODO: Parse and use user's locale
     *
     * @returns {string}
     */
    const getLocale = () => {
        return 'en';
    };

    return {
        init: init,
        getLocale: getLocale
    };

})();