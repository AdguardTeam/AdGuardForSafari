/**
 * Events
 */
const EventNotifierTypes = module.exports = {
    ADD_RULES: "event.add.rules",
    REMOVE_RULE: "event.remove.rule",
    UPDATE_FILTER_RULES: "event.update.filter.rules",
    FILTER_ENABLE_DISABLE: "event.filter.enable.disable", // Enabled or disabled
    FILTER_ADD_REMOVE: "event.filter.add.remove", // Added or removed
    ADS_BLOCKED: "event.ads.blocked",
    START_DOWNLOAD_FILTER: "event.start.download.filter",
    SUCCESS_DOWNLOAD_FILTER: "event.success.download.filter",
    ERROR_DOWNLOAD_FILTER: "event.error.download.filter",
    ENABLE_FILTER_SHOW_POPUP: "event.enable.filter.show.popup",
    LOG_EVENT: "event.log.track",
    UPDATE_TAB_BUTTON_STATE: "event.update.tab.button.state",
    REQUEST_FILTER_UPDATED: "event.request.filter.updated",
    APPLICATION_INITIALIZED: "event.application.initialized",
    APPLICATION_UPDATED: "event.application.updated",
    CHANGE_PREFS: "event.change.prefs",
    UPDATE_FILTERS_SHOW_POPUP: "event.update.filters.show.popup",
    UPDATE_USER_FILTER_RULES: "event.update.user.filter.rules",
    UPDATE_WHITELIST_FILTER_RULES: "event.update.whitelist.filter.rules",
    // Log events
    TAB_ADDED: 'log.tab.added',
    TAB_CLOSE: 'log.tab.close',
    TAB_UPDATE: 'log.tab.update',
    TAB_RESET: 'log.tab.reset',
    LOG_EVENT_ADDED: 'log.event.added',
    LOG_EVENT_UPDATED: 'log.event.updated',
    // Sync events
    SYNC_REQUIRED: 'event.sync.required',
    SYNC_BAD_OR_EXPIRED_TOKEN: 'event.sync.bad.or.expired.token',
    SYNC_STATUS_UPDATED: 'event.sync.status.updated',
    SETTINGS_UPDATED: 'event.sync.finished'
};