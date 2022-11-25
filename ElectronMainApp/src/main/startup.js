const safariToolbar = require('safari-ext');
const allowlist = require('./app/allowlist');
const filters = require('./app/filters-manager');
const antibanner = require('./app/antibanner');
const filterState = require('./app/filters/filters-state');
const log = require('./app/utils/log');
const contentBlockerListener = require('./app/content-blocker/content-blocker-listener');
const notificationController = require('./notification-controller');
const toolbarController = require('./toolbar-controller');
const settings = require('./app/settings-manager.js');

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

        // set launch at login
        const isLaunchAtLoginEnabled = settings.isLaunchAtLoginEnabled();
        if (isLaunchAtLoginEnabled !== safariToolbar.startAtLogin()) {
            safariToolbar.setStartAtLogin(isLaunchAtLoginEnabled);
            log.info('Launch at login set to {0}', isLaunchAtLoginEnabled);
        }

        allowlist.init();
        log.debug('Allowlist initialization completed');

        contentBlockerListener.init();
        log.debug('Content blocker listener initialization completed');

        filterState.init();
        log.debug('Filters state initialization completed');

        notificationController.init(showWindow);
        log.debug('Notifications controller initialization completed');

        antibanner.start({
            onInstall() {
                log.debug('On application install..');

                // Retrieve filters and install them
                filters.offerGroupsAndFilters((groupIds) => {
                    groupIds.forEach((groupId) => filters.enableFiltersGroup(groupId));
                });

                log.info('Application installed');

                callback(true);
            },
        }, () => {
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
        init,
    };
})();
