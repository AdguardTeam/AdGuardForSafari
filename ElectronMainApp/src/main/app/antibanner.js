const config = require('config');
const log = require('./utils/log');
const subscriptions = require('./filters/subscriptions');
const customFilters = require('./filters/custom-filters');
const listeners = require('../notifier');
const events = require('../events');
const filters = require('./filters-manager');
const settings = require('./settings-manager');
const collections = require('./utils/collections');
const updateService = require('./update-service');
const filtersUpdate = require('./filters/filters-update');
const filterRules = require('./filters/filter-rules');

/**
 * Antibanner service
 */
module.exports = (() => {
    const { USER_FILTER_ID } = config.get('AntiBannerFiltersId');

    let applicationInitialized = false;
    let applicationRunning = false;
    let requestFilter = null;
    let requestFilterInitTime = 0;

    /**
     * Persist state of content blocker
     */
    const contentBlockerInfo = {
        rulesCount: 0,
        rulesOverLimit: false,
        advancedBlockingRulesCount: 0,
    };

    /**
     * Delay on application updated event
     */
    const APP_UPDATED_NOTIFICATION_DELAY = 10000;

    const FILTERS_CHANGE_DEBOUNCE_PERIOD = 1000;

    /**
     * List of events which cause RequestFilter re-creation
     * @type {Array}
     */
    const UPDATE_REQUEST_FILTER_EVENTS = [
        events.UPDATE_FILTER_RULES,
        events.FILTER_ENABLE_DISABLE,
        events.FILTER_GROUP_ENABLE_DISABLE,
    ];

    const isUpdateRequestFilterEvent = function (el) {
        return UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    const SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [events.UPDATE_FILTER_RULES, events.ADD_RULES, events.REMOVE_RULE];

    const isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * Triggers groups load
     */
    function loadGroupsStateInfo() {
        filters.getGroups();
    }

    /**
     * Triggers filters load
     */
    const loadFiltersVersionAndStateInfo = () => {
        filters.getFilters();
    };

    /**
     * Subscribe to events which lead to filters update.
     */
    const subscribeToFiltersChangeEvents = () => {
        settings.onUpdated.addListener((setting) => {
            if (setting === settings.UPDATE_FILTERS_PERIOD) {
                filtersUpdate.rerunAutoUpdateTimer();
            }
        });
    };

    /**
     * Called when filters were loaded from the storage
     *
     * @param rulesFilterMap Map for populating rules (filterId -> rules collection)
     * @param callback Called when request filter is initialized
     */
    const onFiltersLoadedFromStorage = (rulesFilterMap, callback) => {
        const start = new Date().getTime();

        log.info('Starting request filter initialization.');

        // Empty request filter
        const newRequestFilter = {
            rules: [],
        };

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            listeners.notifyListeners(events.APPLICATION_INITIALIZED);
        }

        /**
         * STEP 3: Called when request filter has been filled with rules.
         * This is the last step of request filter initialization.
         */
        const requestFilterInitialized = function () {
            // Request filter is ready
            requestFilter = newRequestFilter;

            if (callback && typeof callback === 'function') {
                callback();
            }

            listeners.notifyListeners(events.REQUEST_FILTER_UPDATED);
            const rulesCount = newRequestFilter.rules ? newRequestFilter.rules.length : 0;
            log.debug('Rules count {0}', rulesCount);
            log.info(
                'Finished request filter initialization in {0} ms. Rules count: {1}',
                (new Date().getTime() - start),
                rulesCount
            );
        };

        /**
         * Supplement function for adding rules to the request filter
         *
         * @param filterId Filter identifier
         * @param rulesTexts Array with filter rules
         * @param isTrustedFilter custom filter can be trusted and untrusted, default is true
         */
        const addRules = function (filterId, rulesTexts, isTrustedFilter = true) {
            if (!rulesTexts || !collections.isArray(rulesTexts)) {
                log.debug(`Something wrong with rules:${rulesTexts}`);
                return;
            }

            log.debug('Adding rules for filter {0}, rules count: {1}', filterId, rulesTexts.length);

            for (let i = 0; i < rulesTexts.length; i += 1) {
                const ruleText = rulesTexts[i];
                if (ruleText
                    && (isTrustedFilter || filterRules.isTrustedRule(ruleText))) {
                    newRequestFilter.rules.push({
                        filterId,
                        ruleText,
                    });
                }
            }
        };

        /**
         * Synchronously fills request filter with rules
         */
        const fillRequestFilterSync = function () {
            // Go through all filters in the map
            for (const filterId in rulesFilterMap) {
                const filterIdNum = parseInt(filterId, 10);
                if (filterId !== USER_FILTER_ID) {
                    const rulesTexts = rulesFilterMap[filterIdNum];
                    const isTrustedFilter = customFilters.isTrustedFilter(filterIdNum);
                    addRules(filterIdNum, rulesTexts, isTrustedFilter);
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            const userRules = rulesFilterMap[USER_FILTER_ID];
            addRules(USER_FILTER_ID, userRules);
            requestFilterInitialized();
        };

        fillRequestFilterSync();
    };

    /**
     * Create new request filter and add distinct rules from the storage.
     *
     * @param callback Called after request filter has been created
     * @private
     */
    const createRequestFilter = (callback) => {
        const start = new Date().getTime();
        log.info('Starting loading filter rules from the storage');

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        const rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        const loadAllFilterRulesDone = function () {
            log.info('Finished loading filter rules from the storage in {0} ms', (new Date().getTime() - start));
            onFiltersLoadedFromStorage(rulesFilterMap, callback);
        };

        /**
         * STEP 1: load all filters from the storage.
         */
        const loadFilterRules = function () {
            const dfds = [];
            const filters = subscriptions.getFilters();
            for (let i = 0; i < filters.length; i += 1) {
                const filter = filters[i];
                const group = subscriptions.getGroup(filter.groupId);
                if (filter.enabled && group.enabled) {
                    dfds.push(filterRules.loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            dfds.push(filterRules.loadUserRules(rulesFilterMap));

            // Load all filters and then recreate request filter
            Promise.all(dfds).then(loadAllFilterRulesDone);
        };

        loadFilterRules();
    };

    /**
     * @returns rules array or []
     */
    const getRules = () => {
        return requestFilter ? requestFilter.rules : [];
    };

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     */
    const addFiltersChangeEventListener = () => {
        let filterEventsHistory = [];
        let onFilterChangeTimeout = null;

        const processEventsHistory = function () {
            const filterEvents = filterEventsHistory.slice(0);
            filterEventsHistory = [];
            onFilterChangeTimeout = null;

            const needCreateRequestFilter = filterEvents.some(isUpdateRequestFilterEvent);

            // Split by filterId
            const eventsByFilter = Object.create(null);
            for (let i = 0; i < filterEvents.length; i += 1) {
                const filterEvent = filterEvents[i];
                // don't add group events
                if (!filterEvent.filter) {
                    continue;
                }
                if (!(filterEvent.filter.filterId in eventsByFilter)) {
                    eventsByFilter[filterEvent.filter.filterId] = [];
                }
                eventsByFilter[filterEvent.filter.filterId].push(filterEvent);
            }

            const dfds = [];
            for (const filterId in eventsByFilter) {
                const needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                if (!needSaveRulesToStorage) {
                    continue;
                }
                const dfd = filterRules.processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                dfds.push(dfd);
            }

            if (needCreateRequestFilter) {
                // Rules will be added to request filter lazy,
                // listeners will be notified about REQUEST_FILTER_UPDATED later
                Promise.all(dfds).then(createRequestFilter);
            } else {
                // Rules are already in request filter, notify listeners
                listeners.notifyListeners(events.REQUEST_FILTER_UPDATED);
            }
        };

        const processFilterEvent = function (event, filter, rules) {
            filterEventsHistory.push({ event, filter, rules });

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(processEventsHistory, FILTERS_CHANGE_DEBOUNCE_PERIOD);
        };

        const processGroupEvent = function (event, group) {
            filterEventsHistory.push({ event, group });

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(processEventsHistory, FILTERS_CHANGE_DEBOUNCE_PERIOD);
        };

        listeners.addListener((event, filter, rules) => {
            switch (event) {
                case events.ADD_RULES:
                case events.REMOVE_RULE:
                case events.UPDATE_FILTER_RULES:
                case events.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
                    break;
                default:
                    break;
            }
        });

        listeners.addListener((event, group) => {
            switch (event) {
                case events.FILTER_GROUP_ENABLE_DISABLE:
                    processGroupEvent(event, group);
                    break;
                default:
                    break;
            }
        });
    };

    /**
     * AntiBannerService initialize method. Process install, update or simple run.
     *
     * @param options
     * @param callback
     */
    const initialize = (options, callback) => {
        /**
         * Waits and notifies listener with application updated event
         *
         * @param runInfo
         */
        const notifyApplicationUpdated = (runInfo) => {
            setTimeout(() => {
                listeners.notifyListeners(events.APPLICATION_UPDATED, runInfo);
            }, APP_UPDATED_NOTIFICATION_DELAY);
        };

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        const initRequestFilter = () => {
            log.info('Init request filter..');

            loadFiltersVersionAndStateInfo();
            loadGroupsStateInfo();

            log.debug('Create request filter');
            createRequestFilter(() => {
                addFiltersChangeEventListener();

                log.info('Init request filter completed');
                callback();
            });
        };

        /**
         * Callback for subscriptions loaded event
         */
        const onSubscriptionLoaded = (runInfo) => {
            // Subscribe to events which lead to update filters (e.g. switch to optimized and back to default)
            subscribeToFiltersChangeEvents();

            if (runInfo.isFirstRun) {
                // Add event listener for filters change
                addFiltersChangeEventListener();
                // Run callback
                // Request filter will be initialized during install
                if (typeof options.onInstall === 'function') {
                    options.onInstall(callback);
                } else {
                    callback();
                }
            } else if (runInfo.isUpdate) {
                // Updating storage schema on extension update (if needed)
                updateService.onUpdate(runInfo, initRequestFilter);
                // Show updated version popup
                notifyApplicationUpdated(runInfo);
            } else {
                // Init RequestFilter object
                initRequestFilter();
            }

            // Schedule filters update job
            filtersUpdate.scheduleFiltersUpdate(runInfo.isFirstRun);
        };

        /**
         * Init extension common info.
         */
        updateService.getRunInfo((runInfo) => {
            log.info('Load subscription metadata from the storage');
            subscriptions.init(onSubscriptionLoaded.bind(null, runInfo));
        });
    };

    /**
     * Initialize application (process install or update)
     *
     * @param options
     * @param callback
     */
    const start = (options, callback) => {
        log.info('Starting antibanner service..');

        if (applicationRunning === true) {
            callback();
            return;
        }

        log.debug('Set app running');

        applicationRunning = true;
        listeners.notifyListeners(events.PROTECTION_STATUS_CHANGED, true);

        log.debug('Listeners notified');

        if (!applicationInitialized) {
            initialize(options, callback);
            applicationInitialized = true;
            return;
        }

        createRequestFilter(callback);

        log.info('Starting antibanner service finished');
    };

    /**
     * Clear request filter
     */
    const stop = () => {
        applicationRunning = false;

        // Set empty request filter
        requestFilter = {
            rules: [],
        };

        listeners.notifyListeners(events.REQUEST_FILTER_UPDATED);
        listeners.notifyListeners(events.PROTECTION_STATUS_CHANGED, false);
    };

    /**
     * Is Application running
     */
    const isRunning = () => applicationRunning;

    /**
     * Update content blocker info
     * We save state of content blocker for properly show in options page (converted rules count and over limit flag)
     * @param info Content blocker info
     */
    const updateContentBlockerInfo = (info) => {
        contentBlockerInfo.rulesCount = info.rulesCount;
        contentBlockerInfo.rulesOverLimit = info.rulesOverLimit;
        contentBlockerInfo.advancedBlockingRulesCount = info.advancedBlockingRulesCount;
    };

    /**
     * Content Blocker info
     */
    const getContentBlockerInfo = () => contentBlockerInfo;

    return {
        start,
        stop,
        isRunning,
        getRules,
        updateContentBlockerInfo,
        getContentBlockerInfo,
    };
})();
