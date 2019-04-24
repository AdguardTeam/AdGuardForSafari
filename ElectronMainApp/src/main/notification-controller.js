const { Notification } = require('electron');

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
    const showNotification = (params) => {
        let {
            title,
            subtitle,
            body,
            onClick,
            silent
        } = params;

        let notification = new Notification({ title, subtitle, body, silent });

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

        const title = i18n
            .__("options_popup_version_update_title.message")
            .replace('$1', options.currentVersion);
        const subtitle = options.isMajorUpdate ?
            i18n.__("options_popup_version_update_description_major.message") :
            i18n.__("options_popup_version_update_description_minor.message");

        showNotification({ title, subtitle, silent: false });
    };

    /**
     * Shows app update not found notification
     */
    const showAppUpdateNotFoundNotification = () => {
        const title = i18n.__("options_popup_app_no_update_title.message");
        const subtitle = i18n.__("options_popup_app_no_update_description.message");

        showNotification({ title, subtitle, silent: false });
    };

    /**
     * Shows app update found notification
     *
     * @param options
     */
    const showAppUpdateAvailableNotification = (options) => {
        if (!options) {
            return;
        }

        const title = i18n.__("options_popup_app_update_title.message");
        const subtitle = i18n.__("options_popup_app_update_description.message")
            .replace('$1', options.version);

        showNotification({ title, subtitle, silent: false });
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

                let message;
                if (updatedFilters.length === 1) {
                    message = i18n.__("options_popup_update_updated.message");
                    const filter = updatedFilters[0];
                    text.push(message.replace("$1", filter.name).replace("$2", filter.version));
                } else {
                    message = i18n.__n('options_popup_update_updated_more.message', updatedFilters.length);
                    const filtersListString = updatedFilters.map(f => `"${f.name}"`).join(', ');
                    text.push(message.replace("$2", filtersListString));
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
     * Return event click handler to show main window's user rules tab
     *
     * @param showMainWindow
     */
    const getShowUserFilterTabOnClick = (showMainWindow) => {
        return function () {
            showMainWindow(function () {
                listeners.notifyListeners(events.SHOW_OPTIONS_USER_FILTER_TAB);
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

        const { title, text } = getFiltersUpdateResultMessage(options.success, options.updatedFilters);
        showNotification({ 
            title,
            subtitle: text,
            onClick: getShowFiltersTabOnClick(showMainWindow),
            silent: true
        });
    };

    /**
     * Rules are over safari content blocker limit
     *
     * @param showMainWindow
     */
    const showRulesOverLimitNotification = (showMainWindow) => {
        const title = i18n.__("notification_content_blocker_overlimit_title.message");
        const subtitle = i18n.__("notification_content_blocker_overlimit_desc.message");

        showNotification({ 
            title,
            subtitle,
            onClick: getShowFiltersTabOnClick(showMainWindow),
            silent: false
        });
    };

    /**
     * User rules changed notification
     *
     * @param showMainWindow
     */
    const showUserFilterUpdatedNotification = (showMainWindow, newRule) => {
        const title = i18n.__("notification_user_filter_updated_title.message");
        const subtitle = i18n.__("notification_user_filter_updated_desc.message");
        const body = newRule;

        showNotification({
            title,
            subtitle,
            body,
            onClick: getShowUserFilterTabOnClick(showMainWindow),
            silent: true
        });
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
            } else if (event === events.APPLICATION_UPDATE_FOUND) {
                showAppUpdateAvailableNotification(options);
            } else if (event === events.APPLICATION_UPDATE_NOT_FOUND) {
                showAppUpdateNotFoundNotification();
            } else if (event === events.CONTENT_BLOCKER_UPDATED) {
                if (options.rulesOverLimit) {
                    showRulesOverLimitNotification(showWindow);
                }
            } else if (event === events.NOTIFY_UPDATE_USER_FILTER_RULES) {
                const newRule = options ? options.newRule : '';
                showUserFilterUpdatedNotification(showWindow, newRule);
            }
        });
    };

    return {
        init: init
    };

})();