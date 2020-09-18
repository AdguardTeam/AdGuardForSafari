const config = require('config');
const cache = require('./cache');
const serviceClient = require('./service-client');
const { SubscriptionFilter } = require('./metadata');
const localStorage = require('../storage/storage');
const listeners = require('../../notifier');
const events = require('../../events');
const log = require('../utils/log');
const {
    CUSTOM_FILTERS_START_ID,
    CUSTOM_FILTERS_JSON_KEY,
} = require('./constants');

/**
 * Amount of lines to parse metadata from filter's header
 * @type {number}
 */
const AMOUNT_OF_LINES_TO_PARSE = 50;

/**
 * Custom filters group identifier
 * @type {number}
 */
const { CUSTOM_FILTERS_GROUP_ID } = config.get('AntiBannerFilterGroupsId');

module.exports = (function () {
    /**
     * Parses filter metadata from rules header
     *
     * @param rules
     * @returns object
     */
    const parseFilterDataFromHeader = (rules) => {
        function parseTag(tagName) {
            let result = '';

            const maxLines = Math.min(AMOUNT_OF_LINES_TO_PARSE, rules.length);
            const search = `! ${tagName}: `;
            for (let i = 0; i < maxLines; i += 1) {
                const r = rules[i];
                const index = r.indexOf(search);
                if (index >= 0) {
                    result = r.substring(index + search.length);
                }
            }

            return result;
        }

        return {
            name: parseTag('Title'),
            description: parseTag('Description'),
            homepage: parseTag('Homepage'),
            version: parseTag('Version'),
            expires: parseTag('Expires'),
            timeUpdated: parseTag('TimeUpdated'),
        };
    };

    const addFilterId = () => {
        let max = 0;
        const filters = cache.getFilters();
        filters.forEach((f) => {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= CUSTOM_FILTERS_START_ID ? max + 1 : CUSTOM_FILTERS_START_ID;
    };

    const getCustomFilterInfo = (url, options, callback) => {
        const { title } = options;

        serviceClient.loadFilterRulesBySubscriptionUrl(url, (rules) => {
            /* eslint-disable prefer-const */
            let {
                name,
                description,
                homepage,
                version,
                expires,
                timeUpdated,
            } = parseFilterDataFromHeader(rules);

            name = name || title;
            timeUpdated = timeUpdated || new Date().toISOString();

            const groupId = CUSTOM_FILTERS_GROUP_ID;
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];
            const rulesCount = rules.filter((rule) => rule.trim().indexOf('!') !== 0).length;

            const filter = new SubscriptionFilter(
                null,
                groupId,
                name,
                description,
                homepage,
                version,
                timeUpdated,
                displayNumber,
                languages,
                expires,
                subscriptionUrl,
                tags
            );

            filter.loaded = true;
            filter.customUrl = url;
            filter.rulesCount = rulesCount;

            callback({ filter, rules });
        }, (cause) => {
            log.error(`Error download filter by url ${url}, cause: ${cause || ''}`);
            callback();
        });
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param options
     * @param callback
     */
    const addCustomFilter = (url, options, callback) => {
        const { title, trusted } = options;

        // Check if filter with the same url exists
        let filter = loadCustomFilters().find((f) => f.customUrl === url);

        if (filter) {
            filter.trusted = trusted;
            updateCustomFilter(filter, (filterId) => {
                log.info(`Custom filter with ID ${filterId} successfully updated`);
                callback(filterId);
            });
            return;
        }

        serviceClient.loadFilterRulesBySubscriptionUrl(url, (rules) => {
            const filterData = parseFilterDataFromHeader(rules);

            const filterId = addFilterId();
            const groupId = CUSTOM_FILTERS_GROUP_ID;
            const defaultName = filterData.name || title;
            const defaultDescription = filterData.description;
            const { homepage, version, expires } = filterData;
            const timeUpdated = filterData.timeUpdated || new Date().toString();
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];
            const rulesCount = rules.length;

            filter = new SubscriptionFilter(
                filterId,
                groupId,
                defaultName,
                defaultDescription,
                homepage,
                version,
                timeUpdated,
                displayNumber,
                languages,
                expires,
                subscriptionUrl,
                tags
            );
            filter.loaded = true;
            filter.enabled = true;
            // custom filters have special fields
            filter.customUrl = url;
            filter.rulesCount = rulesCount;
            filter.trusted = trusted;

            cache.updateFilters(filter);

            // Save filter in separate storage
            saveCustomFilter(filter);

            listeners.notifyListeners(events.SUCCESS_DOWNLOAD_FILTER, filter);
            listeners.notifyListeners(events.UPDATE_FILTER_RULES, filter, rules);

            callback(filter.filterId);
        }, (request, cause) => {
            log.error('Error download filter by url {0}, cause: {1} {2}', url, request.statusText, cause || '');
            callback();
        });
    };

    /**
     * Saves custom filter to storage
     *
     * @param filter
     */
    const saveCustomFilter = (filter) => {
        const customFilters = loadCustomFilters();
        customFilters.push(filter);

        localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(customFilters));
    };

    /**
     * Removes custom filter from storage
     *
     * @param filter
     */
    const removeCustomFilter = (filter) => {
        const customFilters = loadCustomFilters();
        const updatedFilters = customFilters.filter((f) => f.filterId !== filter.filterId);

        localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(updatedFilters));
        cache.removeFilter(filter.filterId);
    };

    /**
     * Rewrites custom filter to storage
     *
     * @param customFilter
     * @param callback
     */
    const updateCustomFilter = (customFilter, callback) => {
        getCustomFilterInfo(
            customFilter.customUrl,
            { title: customFilter.name, trusted: customFilter.trusted },
            (result = {}) => {
                const { filter, rules } = result;
                if (filter) {
                    const customFilters = loadCustomFilters();
                    customFilters.forEach((f) => {
                        if (f.customUrl === customFilter.customUrl) {
                            f.name = filter.name;
                            f.version = filter.version;
                            f.description = filter.description;
                            f.timeUpdated = new Date().toString();
                            f.lastUpdateTime = f.timeUpdated;
                            f.trusted = customFilter.trusted;
                            cache.updateFilters(f);
                            listeners.notifyListeners(events.SUCCESS_DOWNLOAD_FILTER, f);
                            listeners.notifyListeners(events.UPDATE_FILTER_RULES, f, rules);
                        }
                    });
                    localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(customFilters));
                    callback(customFilter.filterId);
                }
            }
        );
    };

    /**
     * Loads custom filters from storage
     *
     * @returns {Array}
     */
    const loadCustomFilters = () => {
        const customFilters = localStorage.getItem(CUSTOM_FILTERS_JSON_KEY);
        return customFilters ? JSON.parse(customFilters) : [];
    };

    return {
        addCustomFilter,
        updateCustomFilter,
        getCustomFilterInfo,
        removeCustomFilter,
        loadCustomFilters,
    };
})();
