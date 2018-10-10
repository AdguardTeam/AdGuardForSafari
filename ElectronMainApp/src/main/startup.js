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
    const init = (showWindow) => {
        log.info('Application initialization..');

        safariToolbar.busyStatus(true);

        whitelist.init();
        contentBlockerListener.init();
        filterState.init();
        notificationController.init(showWindow);

        antibanner.start({
            onInstall: function (callback) {
                log.debug('On application install..');

                // Retrieve filters and install them
                filters.offerGroupsAndFilters(function (groupIds, filterIds) {
                    groupIds.forEach(groupId => filters.enableFiltersGroup(groupId));

                    filters.addAndEnableFilters(filterIds, callback);
                });

                showWindow();

                log.info('Application installed');
            }
        }, function () {
            log.info('Application initialization finished');

            safariToolbar.busyStatus(false);
            safariToolbar.sendReady();

            // Check safari extensions
            safariToolbar.extensionsState((result) => {
                if (!result) {
                    log.warn('Safari extensions are not ok!');

                    showWindow();
                }
            });
        });
    };

    return {
        init
    };

})();