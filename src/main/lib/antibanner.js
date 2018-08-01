const log = require('./utils/log');
const i18n = require('./utils/i18n');
const config = require('config');
const subscriptions = require('./filters/subscriptions');
const listeners = require('../notifier');
const filters = require('./filters-manager');
const settings = require('./settings-manager');
const rulesStorage = require('./storage/rules-storage');
const collections = require('./utils/collections');

/**
 * Antibanner service
 */
module.exports = (() => {

    const USER_FILTER_ID = config.get('AntiBannerFiltersId').USER_FILTER_ID;

    let applicationInitialized = false;
    let requestFilter = null;

    /**
     * Period for filters update check -- 48 hours
     */
    const UPDATE_FILTERS_PERIOD = 48 * 60 * 60 * 1000;

    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    const UPDATE_FILTERS_DELAY = 5 * 60 * 1000;

    /**
     * Delay on application updated event
     */
    const APP_UPDATED_NOTIFICATION_DELAY = 10000;

    const FILTERS_CHANGE_DEBOUNCE_PERIOD = 1000;
    const RELOAD_FILTERS_DEBOUNCE_PERIOD = 1000;


    /**
     * List of events which cause RequestFilter re-creation
     * @type {Array}
     */
    const UPDATE_REQUEST_FILTER_EVENTS = [listeners.UPDATE_FILTER_RULES, listeners.FILTER_ENABLE_DISABLE];

    const isUpdateRequestFilterEvent = function (el) {
        return UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    const SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [listeners.UPDATE_FILTER_RULES, listeners.ADD_RULES, listeners.REMOVE_RULE];

    const isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    const debounce = function (func, wait) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            const later = () => {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const scheduleFiltersUpdate = () => {
        //TODO: scheduleFiltersUpdate
    };

    const loadFiltersVersionAndStateInfo = () => {
        filters.getFilters();
    };

    const reloadAntiBannerFilters = () => {
        //TODO: reloadAntiBannerFilters
        //resetFiltersVersion();
        //checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    };

    /**
     * Subscribe to events which lead to filters update.
     */
    const subscribeToFiltersChangeEvents = () => {
        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        const onUsedOptimizedFiltersChange = debounce(reloadAntiBannerFilters, RELOAD_FILTERS_DEBOUNCE_PERIOD);

        settings.onUpdated.addListener(function (setting) {
            if (setting === settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
                return;
            }
        });
    };

    /**
     * Loads filter rules from storage
     *
     * @param filterId Filter identifier
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     */
    const loadFilterRulesFromStorage = (filterId, rulesFilterMap) => {
        return new Promise((resolve) => {
            rulesStorage.read(filterId, rulesText => {
                if (rulesText) {
                    rulesFilterMap[filterId] = rulesText;
                }

                resolve();
            });
        });
    };

    /**
     * Adds user rules (got from the storage)
     *
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     * @private
     */
    const loadUserRules = (rulesFilterMap) => {
        return new Promise((resolve) => {
            rulesStorage.read(USER_FILTER_ID, rulesText => {
                if (!rulesText) {
                    resolve();
                    return;
                }

                rulesFilterMap[USER_FILTER_ID] = rulesText;
                resolve();
            });
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
        let newRequestFilter = {
            rules: []
        };

        // if (requestFilterInitTime === 0) {
        //     // Setting the time of request filter very first initialization
        //     requestFilterInitTime = new Date().getTime();
        //     adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_INITIALIZED);
        // }

        // Supplement object to make sure that we use only unique filter rules
        const uniqueRules = Object.create(null);

        /**
         * STEP 3: Called when request filter has been filled with rules.
         * This is the last step of request filter initialization.
         */
        const requestFilterInitialized = function () {

            // Request filter is ready
            requestFilter = newRequestFilter;

            if (callback && typeof callback === "function") {
                callback();
            }

            listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            log.info("Finished request filter initialization in {0} ms. Rules count: {1}", (new Date().getTime() - start), newRequestFilter.rules.length);
        };

        /**
         * Supplement function for adding rules to the request filter
         *
         * @param filterId Filter identifier
         * @param rulesTexts Array with filter rules
         * @param startIdx Start index of the rules array
         * @param endIdx End index of the rules array
         */
        const addRules = function (filterId, rulesTexts, startIdx, endIdx) {
            if (!rulesTexts) {
                return;
            }

            for (let i = startIdx; i < rulesTexts.length && i < endIdx; i++) {
                const ruleText = rulesTexts[i];
                if (ruleText in uniqueRules) {
                    // Do not allow duplicates
                    continue;
                }
                uniqueRules[ruleText] = true;
                newRequestFilter.rules.push(ruleText);
            }
        };

        /**
         * Synchronously fills request filter with rules
         */
        const fillRequestFilterSync = function () {

            // Go through all filters in the map
            for (let filterId in rulesFilterMap) { // jshint ignore:line

                // To number
                filterId = filterId - 0;
                if (filterId !== USER_FILTER_ID) {
                    const rulesTexts = rulesFilterMap[filterId];
                    addRules(filterId, rulesTexts, 0, rulesTexts.length);
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            const userRules = rulesFilterMap[USER_FILTER_ID];
            addRules(USER_FILTER_ID, userRules, 0, userRules.length);
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
            for (let i = 0; i < filters.length; i++) {
                const filter = filters[i];
                if (filter.enabled) {
                    dfds.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            dfds.push(loadUserRules(rulesFilterMap));

            // Load all filters and then recreate request filter
            Promise.all(dfds).then(loadAllFilterRulesDone);
        };

        loadFilterRules();
    };

    /**
     * Request Filter info
     */
    const getRequestFilterInfo = function () {
        let rulesCount = 0;
        if (requestFilter) {
            rulesCount = requestFilter.rules.length;
        }

        return {
            rulesCount: rulesCount
        };
    };

    const getRules = () => {
        return requestFilter ? requestFilter.rules : [];
    };

    /**
     * Saves updated filter rules to the storage.
     *
     * @param filterId Filter id
     * @param events Events (what has changed?)
     * @private
     */
    const processSaveFilterRulesToStorageEvents = (filterId, events) => {

        return new Promise((resolve) => {
            rulesStorage.read(filterId, function (loadedRulesText) {

                for (let i = 0; i < events.length; i++) {

                    if (!loadedRulesText) {
                        loadedRulesText = [];
                    }

                    const event = events[i];
                    const eventType = event.event;
                    const eventRules = event.rules;

                    switch (eventType) {
                        case listeners.ADD_RULES:
                            loadedRulesText = loadedRulesText.concat(eventRules);
                            log.debug("Add {0} rules to filter {1}", eventRules.length, filterId);
                            break;
                        case listeners.REMOVE_RULE:
                            const actionRule = eventRules[0];
                            collections.removeAll(loadedRulesText, actionRule);
                            log.debug("Remove {0} rule from filter {1}", actionRule, filterId);
                            break;
                        case listeners.UPDATE_FILTER_RULES:
                            loadedRulesText = eventRules;
                            log.debug("Update filter {0} rules count to {1}", filterId, eventRules.length);
                            break;
                    }
                }

                log.debug("Save {0} rules to filter {1}", loadedRulesText.length, filterId);
                rulesStorage.write(filterId, loadedRulesText, function () {
                    resolve();
                    if (filterId === adguard.utils.filters.USER_FILTER_ID) {
                        listeners.notifyListeners(listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
                    }
                });
            });
        });
    };

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     */
    const addFiltersChangeEventListener = () => {
        let filterEventsHistory = [];
        let onFilterChangeTimeout = null;

        const processFilterEvent = function (event, filter, rules) {

            filterEventsHistory.push({event: event, filter: filter, rules: rules});

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(function () {

                const filterEvents = filterEventsHistory.slice(0);
                filterEventsHistory = [];
                onFilterChangeTimeout = null;

                const needCreateRequestFilter = filterEvents.some(isUpdateRequestFilterEvent);

                // Split by filterId
                const eventsByFilter = Object.create(null);
                for (let i = 0; i < filterEvents.length; i++) {
                    const filterEvent = filterEvents[i];
                    if (!(filterEvent.filter.filterId in eventsByFilter)) {
                        eventsByFilter[filterEvent.filter.filterId] = [];
                    }
                    eventsByFilter[filterEvent.filter.filterId].push(filterEvent);
                }

                const dfds = [];
                for (let filterId in eventsByFilter) { // jshint ignore:line
                    let needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                    if (!needSaveRulesToStorage) {
                        continue;
                    }
                    const dfd = processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                    dfds.push(dfd);
                }

                if (needCreateRequestFilter) {
                    // Rules will be added to request filter lazy, listeners will be notified about REQUEST_FILTER_UPDATED later
                    Promise.all(dfds).then(createRequestFilter);
                } else {
                    // Rules are already in request filter, notify listeners
                    listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
                }

            }, FILTERS_CHANGE_DEBOUNCE_PERIOD);

        };

        listeners.addListener(function (event, filter, rules) {
            switch (event) {
                case listeners.ADD_RULES:
                case listeners.REMOVE_RULE:
                case listeners.UPDATE_FILTER_RULES:
                case listeners.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
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
        const notifyApplicationUpdated = runInfo => {
            setTimeout(() => {
                listeners.notifyListeners(listeners.APPLICATION_UPDATED, runInfo);
            }, APP_UPDATED_NOTIFICATION_DELAY);
        };

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        const initRequestFilter = () => {
            loadFiltersVersionAndStateInfo();
            createRequestFilter(() => {
                addFiltersChangeEventListener();
                callback();
            });
        };

        /**
         * Callback for subscriptions loaded event
         */
        const onSubscriptionLoaded = runInfo => {

            // Subscribe to events which lead to update filters (e.g. switсh to optimized and back to default)
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
                //TODO: Implement update-service
                // Updating storage schema on extension update (if needed)
                //adguard.applicationUpdateService.onUpdate(runInfo, initRequestFilter);
                // Show updated version popup
                //notifyApplicationUpdated(runInfo);
            } else {
                // Init RequestFilter object
                initRequestFilter();
            }

            // Schedule filters update job
            scheduleFiltersUpdate(runInfo.isFirstRun);
        };

        /**
         * Init extension common info.
         */
        //TODO: Implement update-service
        // adguard.applicationUpdateService.getRunInfo(runInfo => {
        //     // Load subscription from the storage
        //     subscriptions.init(onSubscriptionLoaded.bind(null, runInfo));
        // });

        subscriptions.init(onSubscriptionLoaded.bind(null, {
            isFirstRun: true,
            isUpdate: false,
            currentVersion: '1.0.0',
            prevVersion: null
        }));
    };

    /**
     * Initialize application (process install or update)
     *
     * @param options
     * @param callback
     */
    const start = (options, callback) => {
        log.info('Starting antibanner service..');

        if (!applicationInitialized) {
            initialize(options, callback);
            applicationInitialized = true;
            return;
        }

        log.info('Starting antibanner service finished');
    };

    /**
     * Offer filters on extension install, select default filters and filters by locale and country
     *
     * @param callback
     */
    const offerFilters = (callback) => {
        // These filters are enabled by default
        let filterIds = [config.AntiBannerFiltersId.ENGLISH_FILTER_ID, config.AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID];

        // Get language-specific filters by user locale
        let localeFilterIds = subscriptions.getFilterIdsForLanguage(i18n.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        callback(filterIds);
    };

    return {
        start: start,
        offerFilters: offerFilters,
        getRequestFilterInfo: getRequestFilterInfo,
        getRules: getRules
    }
})();