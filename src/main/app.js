const whitelist = require('./lib/whitelist');
const filters = require('./lib/filters-manager');
const antibanner = require('./lib/antibanner');
const log = require('./lib/utils/log');

/**
 * Application
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = () => {
        log.info('Application initialization..');

        whitelist.init();

        antibanner.start({
            onInstall: function (callback) {
                // Retrieve filters and install them
                antibanner.offerFilters(function (filterIds) {
                    filters.addAndEnableFilters(filterIds, callback);
                });
            }
        }, function () {
            // Doing nothing
        });

        log.info('Application initialization finished');
    };

    return {
        init: init
    };

})();