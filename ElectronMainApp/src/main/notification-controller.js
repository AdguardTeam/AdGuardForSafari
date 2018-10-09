const {Notification} = require('electron');

const listeners = require('./notifier');
const events = require('./events');
const i18n = require('../utils/i18n');

/**
 * Notifications controller
 */
module.exports = (() => {

    /**
     * Shows system notification
     *
     * @param title
     * @param message
     * @param onClick
     */
    const showNotification = (title, message, onClick) => {
        let notification = new Notification({
            title: title,
            subtitle: message
        });

        if (onClick) {
            notification.addListener("click", (e) => {
                onClick();
            });
        }

        notification.show();
    };

    /**
     * Shows app updated notification
     *
     * @param options
     */
    const showAppUpdatedNotification = (options) => {
        if (!options) {
            return;
        }

        const message = {
            title: i18n.__("options_popup_version_update_title.message").replace('$1', options.currentVersion),
            text: options.isMajorUpdate ?
                i18n.__("options_popup_version_update_description_major.message") :
                i18n.__("options_popup_version_update_description_minor.message")
        };

        showNotification(message.title, message.text);
    };

    const getFiltersUpdateResultMessage = (success, updatedFilters) => {
        const title = success
            ? i18n.__("options_popup_update_title.message")
            : i18n.__("options_popup_update_error_title.message");

        const text = [];

        if (success) {
            if (updatedFilters.length === 0) {
                text.push(i18n.__("options_popup_update_not_found.message"));
            } else {
                updatedFilters.sort(function (a, b) {
                    return a.displayNumber - b.displayNumber;
                });
                for (let i = 0; i < updatedFilters.length; i++) {
                    const filter = updatedFilters[i];
                    text.push(i18n.__("options_popup_update_updated.message", [filter.name, filter.version]).replace("$1", filter.name).replace("$2", filter.version));
                }
            }
        } else {
            text.push(i18n.__("options_popup_update_error.message"));
        }

        return {
            title,
            text: text.join('\r\n')
        };
    };

    /**
     * Return event click handler to show main window's filters tab
     *
     * @param showMainWindow
     */
    const getShowFiltersTabOnClick = (showMainWindow) => {
        return function () {
            showMainWindow(function () {
                listeners.notifyListeners(events.SHOW_OPTIONS_FILTERS_TAB);
            });
        };
    };

    /**
     * Filters updated notification
     *
     * @param options
     * @param showMainWindow
     */
    const showFiltersUpdatedNotification = (options, showMainWindow) => {
        if (!options) {
            return;
        }

        const message = getFiltersUpdateResultMessage(options.success, options.updatedFilters);
        showNotification(message.title, message.text, getShowFiltersTabOnClick(showMainWindow));
    };

    /**
     * Rules are over safari content blocker limit
     *
     * @param showMainWindow
     */
    const showRulesOverLimitNotification = (showMainWindow) => {
        const message = {
            title: i18n.__("notification_content_blocker_overlimit_title.message"),
            text: i18n.__("notification_content_blocker_overlimit_desc.message")
        };

        showNotification(message.title, message.text, getShowFiltersTabOnClick(showMainWindow));
    };

    /**
     * Subscribes to corresponding events
     *
     * @param showWindow
     */
    const init = (showWindow) => {
        listeners.addListener((event, options) => {
            if (event === events.UPDATE_FILTERS_SHOW_POPUP) {
                showFiltersUpdatedNotification(options, showWindow);
            } else if (event === events.APPLICATION_UPDATED) {
                showAppUpdatedNotification(options);
            } else if (event === events.CONTENT_BLOCKER_UPDATED) {
                if (options.rulesOverLimit) {
                    showRulesOverLimitNotification(showWindow);
                }
            }
        });
    };

    return {
        init: init
    };

})();