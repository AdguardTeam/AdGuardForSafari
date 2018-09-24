const whitelist = require('./app/whitelist');
const filters = require('./app/filters-manager');
const antibanner = require('./app/antibanner');
const filterState = require('./app/filters/filters-state');
const log = require('./app/utils/log');
const contentBlockerListener = require('./app/content-blocker/content-blocker-listener');
const notificationController = require('./notification-controller');
const safariToolbar = require('safari-ext');

/**
 * Application startup
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = () => {
        log.info('Application initialization..');

        safariToolbar.busyStatus(true);

        whitelist.init();
        contentBlockerListener.init();
        filterState.init();
        notificationController.init();

        antibanner.start({
            onInstall: function (callback) {
                // Retrieve filters and install them
                filters.offerFilters(function (filterIds) {
                    filters.addAndEnableFilters(filterIds, callback);
                });
            }
        }, function () {
            log.info('Application initialization finished');

            safariToolbar.busyStatus(false);
            safariToolbar.sendReady();
        });
    };

    return {
        init: init
    };

})();