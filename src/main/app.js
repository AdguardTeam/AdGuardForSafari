const whitelist = require('./app/whitelist');
const filters = require('./app/filters-manager');
const antibanner = require('./app/antibanner');
const filterState = require('./app/filters/filters-state');
const log = require('./app/utils/log');
const contentBlockerListener = require('./app/content-blocker/content-blocker-listener');

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
        contentBlockerListener.init();
        filterState.init();

        antibanner.start({
            onInstall: function (callback) {
                // Retrieve filters and install them
                antibanner.offerFilters(function (filterIds) {
                    filters.addAndEnableFilters(filterIds, callback);
                });
            }
        }, function () {
            log.info('Application initialization finished');
        });
    };

    return {
        init: init
    };

})();