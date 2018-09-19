const {Notification} = require('electron');

const listeners = require('./notifier');
const events = require('./events');
const i18n = require('../utils/i18n');
const appPack = require('../utils/app-pack');

/**
 * Notifications controller
 */
module.exports = (() => {

    /**
     * Shows system notification
     *
     * @param title
     * @param message
     */
    const showNotification = (title, message) => {
        let notification = new Notification({
            title: title,
            subtitle: message,
            icon: appPack.resourcePath('/src/main/icons/app-icon-16.png')
        });

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
        const title = i18n.__("options_popup_update_title.message");
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
            title: title,
            text: text.join('\r\n')
        };
    };

    /**
     * Filters updated notification
     *
     * @param options
     */
    const showFiltersUpdatedNotification = (options) => {
        if (!options) {
            return;
        }

        const message = getFiltersUpdateResultMessage(options.success, options.updatedFilters);
        showNotification(message.title, message.text);
    };

    /**
     * Subscribes to corresponding events
     */
    const init = () => {
        listeners.addListener((event, options) => {
            if (event === events.UPDATE_FILTERS_SHOW_POPUP) {
                showFiltersUpdatedNotification(options);
            } else if (event === events.APPLICATION_UPDATED) {
                showAppUpdatedNotification(options);
            }
        });
    };

    return {
        init: init
    };

})();