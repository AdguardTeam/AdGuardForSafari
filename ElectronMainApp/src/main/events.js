/**
 * Events
 */
/* eslint-disable no-unused-vars */
/* eslint-disable no-multi-assign */
const EventNotifierTypes = module.exports = {
    ADD_RULES: 'event.add.rules',
    REMOVE_RULE: 'event.remove.rule',
    UPDATE_FILTER_RULES: 'event.update.filter.rules',
    FILTER_ENABLE_DISABLE: 'event.filter.enable.disable', // Enabled or disabled
    FILTER_ADD_REMOVE: 'event.filter.add.remove', // Added or removed
    FILTER_GROUP_ENABLE_DISABLE: 'filter.group.enable.disable', // enabled or disabled filter group
    ADS_BLOCKED: 'event.ads.blocked',
    START_DOWNLOAD_FILTER: 'event.start.download.filter',
    SUCCESS_DOWNLOAD_FILTER: 'event.success.download.filter',
    ERROR_DOWNLOAD_FILTER: 'event.error.download.filter',
    ENABLE_FILTER_SHOW_POPUP: 'event.enable.filter.show.popup',
    LOG_EVENT: 'event.log.track',
    UPDATE_TAB_BUTTON_STATE: 'event.update.tab.button.state',
    REQUEST_FILTER_UPDATED: 'event.request.filter.updated',
    APPLICATION_INITIALIZED: 'event.application.initialized',
    APPLICATION_UPDATED: 'event.application.updated',
    APPLICATION_UPDATE_FOUND: 'event.application.update.found',
    APPLICATION_UPDATE_NOT_FOUND: 'event.application.update.not.found',
    APPLICATION_UPDATE_NOT_ALLOWED: 'event.application.update.not.allowed',
    APPLICATION_UPDATE_DOWNLOADED: 'event.application.update.downloaded',
    APPLICATION_UPDATE_ERROR: 'event.application.update.error',
    CHANGE_PREFS: 'event.change.prefs',
    UPDATE_FILTERS_SHOW_POPUP: 'event.update.filters.show.popup',
    UPDATE_USER_FILTER_RULES: 'event.update.user.filter.rules',
    NOTIFY_UPDATE_USER_FILTER_RULES: 'event.notify.update.user.filter.rules',
    CUSTOM_FILTER_INFO_SET: 'event.notify.custom.filter.info.set',
    UPDATE_ALLOWLIST_FILTER_RULES: 'event.update.allowlist.filter.rules',
    CONTENT_BLOCKER_UPDATED: 'event.content.blocker.updated',
    CONTENT_BLOCKER_EXTENSION_UPDATED: 'event.content.blocker.extension.updated',
    CONTENT_BLOCKER_UPDATE_REQUIRED: 'event.content.blocker.update.required',
    SHOW_OPTIONS_FILTERS_TAB: 'event.show.options.filters',
    SHOW_OPTIONS_USER_FILTER_TAB: 'event.show.options.user.filter',
    SHOW_OPTIONS_GENERAL_TAB: 'event.show.options.general',
    SHOW_OPTIONS_ABOUT_TAB: 'event.show.options.about',
    PROTECTION_STATUS_CHANGED: 'event.protection.status.updated',
    FILTERS_PERIOD_UPDATED: 'event.filters.period.updated',
    SETTING_UPDATED: 'event.update.setting.value',
    SETTINGS_UPDATED: 'event.settings.updated',
    // Log events
    TAB_ADDED: 'log.tab.added',
    TAB_CLOSE: 'log.tab.close',
    TAB_UPDATE: 'log.tab.update',
    TAB_RESET: 'log.tab.reset',
    LOG_EVENT_ADDED: 'log.event.added',
    LOG_EVENT_UPDATED: 'log.event.updated',
};
