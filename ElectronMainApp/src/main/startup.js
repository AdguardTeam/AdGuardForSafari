const whitelist = require('./app/whitelist');
const filters = require('./app/filters-manager');
const antibanner = require('./app/antibanner');
const filterState = require('./app/filters/filters-state');
const log = require('./app/utils/log');
const contentBlockerListener = require('./app/content-blocker/content-blocker-listener');
const notificationController = require('./notification-controller');
const safariToolbar = require('safari-ext');
const toolbarController = require('./toolbar-controller');

/**
 * Application startup
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = (showWindow, callback) => {
        log.info('Application initialization..');

        safariToolbar.busyStatus(true);

        whitelist.init();
        log.debug('Whitelist initialization completed');

        contentBlockerListener.init();
        log.debug('Content blocker listener initialization completed');

        filterState.init();
        log.debug('Filters state initialization completed');

        notificationController.init(showWindow);
        log.debug('Notifications controller initialization completed');

        antibanner.start({
            onInstall: function () {
                log.debug('On application install..');

                // Retrieve filters and install them
                filters.offerGroupsAndFilters(function (groupIds) {
                    groupIds.forEach(groupId => filters.enableFiltersGroup(groupId));
                });

                log.info('Application installed');

                callback(true);
            }
        }, function () {
            log.info('Application initialization finished');

            safariToolbar.busyStatus(false);
            safariToolbar.sendReady();

            // Check safari extensions - show main window only if all cb extensions are disabled
            toolbarController.getExtensionsState((result) => {
                if (!result || result.allContentBlockersDisabled) {
                    log.warn('All Safari content blockers are turned off!');

                    callback(true);
                } else {
                    callback(false);
                }
            });
        });
    };

    return {
        init
    };

})();
