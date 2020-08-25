const { Notification, shell } = require('electron');
const config = require('config');

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
        const {
            title,
            subtitle,
            body,
            onClick,
            silent,
        } = params;

        const notification = new Notification({
            title, subtitle, body, silent,
        });

        if (onClick) {
            /* eslint-disable-next-line no-unused-vars */
            notification.addListener('click', (e) => {
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
            .__('options_popup_version_update_title.message')
            .replace('$1', options.currentVersion);
        const subtitle = options.isMajorUpdate
            ? i18n.__('options_popup_version_update_description_major.message')
            : i18n.__('options_popup_version_update_description_minor.message');
        const url = config.get('repoReleasesUrl');
        const onClick = () => {
            shell.openExternal(url);
        };

        showNotification({
            title, subtitle, onClick, silent: false,
        });
    };

    const getFiltersUpdateResultMessage = (success, updatedFilters) => {
        const title = success
            ? i18n.__('options_popup_update_title.message')
            : i18n.__('options_popup_update_error_title.message');

        const text = [];

        if (success) {
            if (updatedFilters.length === 0) {
                text.push(i18n.__('options_popup_update_not_found.message'));
            } else {
                updatedFilters.sort((a, b) => {
                    return a.displayNumber - b.displayNumber;
                });

                let message;
                if (updatedFilters.length === 1) {
                    message = i18n.__('options_popup_update_updated.message');
                    const filter = updatedFilters[0];
                    text.push(message.replace('$1', filter.name).replace('$2', filter.version));
                } else {
                    message = i18n.__n('options_popup_update_updated_more.message', updatedFilters.length);
                    const filtersListString = updatedFilters.map((f) => `"${f.name}"`).join(', ');
                    text.push(message.replace('$2', filtersListString));
                }
            }
        } else {
            text.push(i18n.__('options_popup_update_error.message'));
        }

        return {
            title,
            text: text.join('\r\n'),
        };
    };

    /**
     * Return event click handler to show main window's filters tab
     *
     * @param showMainWindow
     */
    const getShowFiltersTabOnClick = (showMainWindow) => {
        return function () {
            showMainWindow(() => {
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
            showMainWindow(() => {
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

        if (!options.forceUpdate) {
            // Do not show notification for background updates
            return;
        }

        const { title, text } = getFiltersUpdateResultMessage(options.success, options.updatedFilters);
        showNotification({
            title,
            subtitle: text,
            onClick: getShowFiltersTabOnClick(showMainWindow),
            silent: !options.forceUpdate,
        });
    };

    /**
     * Rules are over safari content blocker limit
     *
     * @param showMainWindow
     */
    const showRulesOverLimitNotification = (showMainWindow) => {
        const title = i18n.__('notification_content_blocker_overlimit_title.message');
        const subtitle = i18n.__('notification_content_blocker_overlimit_desc.message');

        showNotification({
            title,
            subtitle,
            onClick: getShowFiltersTabOnClick(showMainWindow),
            silent: false,
        });
    };

    /**
     * User rules changed notification
     *
     * @param showMainWindow
     */
    const showUserFilterUpdatedNotification = (showMainWindow, newRule) => {
        const title = i18n.__('notification_user_filter_updated_title.message');
        const subtitle = i18n.__('notification_user_filter_updated_desc.message');
        const body = newRule;

        showNotification({
            title,
            subtitle,
            body,
            onClick: getShowUserFilterTabOnClick(showMainWindow),
            silent: true,
        });
    };

    /**
     * Settings update notification
     */
    const showSettingsUpdateNotification = (options) => {
        const title = i18n.__("settings_import.message");
        const subtitle = options.success ?
            i18n.__("settings_import_success.message") :
            i18n.__("settings_import_error.message");
        showNotification({
            title,
            subtitle,
            silent: false,
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
            } else if (event === events.CONTENT_BLOCKER_UPDATED) {
                if (options.rulesOverLimit) {
                    showRulesOverLimitNotification(showWindow);
                }
            } else if (event === events.NOTIFY_UPDATE_USER_FILTER_RULES) {
                const newRule = options ? options.newRule : '';
                showUserFilterUpdatedNotification(showWindow, newRule);
            }
            else if (event === events.SETTINGS_UPDATED) {
                showSettingsUpdateNotification(options);
            }
        });
    };

    return {
        init,
    };
})();
