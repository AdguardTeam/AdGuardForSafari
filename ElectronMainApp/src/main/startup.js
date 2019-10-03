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
        contentBlockerListener.init();
        filterState.init();
        notificationController.init(showWindow);

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
