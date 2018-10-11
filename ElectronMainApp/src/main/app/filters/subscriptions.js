const serviceClient = require('./service-client');
const i18n = require('../utils/i18n');
const versionUtils = require('../utils/version');
const log = require('../utils/log');
const listeners = require('../../notifier');
const events = require('../../events');
const app = require('../app');

/**
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
module.exports = (function () {

    'use strict';

    /**
     * Custom filters group identifier
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_ID = 0;

    /**
     * Custom filters group display number
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;

    let tags = [];
    let groups = [];
    let groupsMap = {};
    let filters = [];
    let filtersMap = {};

    /**
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns timestamp from date string
     */
    function parseTimeUpdated(timeUpdatedString) {
        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        let timeUpdated = Date.parse(timeUpdatedString);
        if (isNaN(timeUpdated)) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, "+$1:$2"));
        }
        if (isNaN(timeUpdated)) {
            timeUpdated = new Date().getTime();
        }

        return timeUpdated;
    }

    /**
     * Tag metadata
     */
    const FilterTag = function (tagId, keyword) {
        this.tagId = tagId;
        this.keyword = keyword;
    };

    /**
     * Group metadata
     */
    const SubscriptionGroup = function (groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    };

    /**
     * Filter metadata
     */
    const SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags) {

        this.filterId = filterId;
        this.groupId = groupId;
        this.name = name;
        this.description = description;
        this.homepage = homepage;
        this.version = version;
        this.timeUpdated = timeUpdated;
        this.displayNumber = displayNumber;
        this.languages = languages;
        this.expires = expires;
        this.subscriptionUrl = subscriptionUrl;
        this.tags = tags;
    };

    /**
     * Create tag from object
     * @param tag Object
     * @returns {FilterTag}
     */
    function createFilterTagFromJSON(tag) {

        const tagId = tag.tagId - 0;
        const keyword = tag.keyword;

        return new FilterTag(tagId, keyword);
    }

    /**
     * Create group from object
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    function createSubscriptionGroupFromJSON(group) {

        const groupId = group.groupId - 0;
        const defaultGroupName = group.groupName;
        const displayNumber = group.displayNumber - 0;

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    }

    /**
     * Create filter from object
     * @param filter Object
     */
    const createSubscriptionFilterFromJSON = filter => {

        const filterId = filter.filterId - 0;
        const groupId = filter.groupId - 0;
        const defaultName = filter.name;
        const defaultDescription = filter.description;
        const homepage = filter.homepage;
        const version = filter.version;
        const timeUpdated = parseTimeUpdated(filter.timeUpdated);
        const expires = filter.expires - 0;
        const subscriptionUrl = filter.subscriptionUrl;
        const languages = filter.languages;
        const displayNumber = filter.displayNumber - 0;
        const tags = filter.tags;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags);
    };

    /**
     * Parses filter metadata from rules header
     *
     * @param rules
     * @returns object
     */
    const parseFilterDataFromHeader = rules => {
        function parseTag(tagName) {
            let result = '';

            //Look up no more than 50 first lines
            const maxLines = Math.min(50, rules.length);
            for (let i = 0; i < maxLines; i++) {
                const r = rules[i];

                const search = '! ' + tagName + ': ';
                const indexOf = r.indexOf(search);
                if (indexOf >= 0) {
                    result = r.substring(indexOf + search.length);
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
            timeUpdated: parseTag('TimeUpdated')
        };
    };

    const addFilterId = () => {
        let max = 0;
        filters.forEach(f => {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= 1000 ? max + 1 : 1000;
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param callback
     */
    const updateCustomFilter = (url, callback) => {

        serviceClient.loadFilterRulesBySubscriptionUrl(url, function (rules) {
            const filterData = parseFilterDataFromHeader(rules);

            const filterId = addFilterId();
            const groupId = 0;
            const defaultName = filterData.name;
            const defaultDescription = filterData.description;
            const homepage = filterData.homepage;
            const version = filterData.version;
            const timeUpdated = filterData.timeUpdated || new Date().toString();
            const expires = filterData.expires;
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];
            const rulesCount = rules.length;

            //Check if filter from this url was added before
            let filter = filters.find(function (f) {
                return f.customUrl === url;
            });

            if (filter) {
                if (version && versionUtils.isGreaterVersion(filter.version, version)) {
                    //Update version is not greater
                    callback();
                    return;
                }
            } else {
                filter = new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags);
                filter.loaded = true;
                //custom filters have special fields
                filter.customUrl = url;
                filter.rulesCount = rulesCount;

                filters.push(filter);
                filtersMap[filter.filterId] = filter;

                listeners.notifyListeners(events.SUCCESS_DOWNLOAD_FILTER, filter);
            }

            listeners.notifyListeners(events.UPDATE_FILTER_RULES, filter, rules);

            callback(filter.filterId);

        }, function (request, cause) {
            log.error("Error download filter by url {0}, cause: {1} {2}", url, request.statusText, cause || "");
            callback();
        });
    };

    /**
     * Load groups and filters metadata
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function loadMetadata(successCallback, errorCallback) {

        serviceClient.loadLocalFiltersMetadata(metadata => {

            tags = [];
            groups = [];
            groupsMap = {};
            filters = [];
            filtersMap = {};

            for (let i = 0; i < metadata.tags.length; i++) {
                tags.push(createFilterTagFromJSON(metadata.tags[i]));
            }

            for (let j = 0; j < metadata.filters.length; j++) {
                const filter = createSubscriptionFilterFromJSON(metadata.filters[j]);
                filters.push(filter);
                filtersMap[filter.filterId] = filter;
            }

            for (let k = 0; k < metadata.groups.length; k++) {
                const group = createSubscriptionGroupFromJSON(metadata.groups[k]);
                groups.push(group);
                groupsMap[group.groupId] = group;
            }

            const customFiltersGroup
                = new SubscriptionGroup(CUSTOM_FILTERS_GROUP_ID, "Custom", CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER);
            groups.push(customFiltersGroup);
            groupsMap[customFiltersGroup.groupId] = customFiltersGroup;

            //TODO: Add localization for Custom group

            filters.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

            groups.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

            log.info('Filters metadata loaded');
            successCallback();

        }, errorCallback);
    }

    /**
     * Loads groups and filters localizations
     * @param successCallback
     * @param errorCallback
     */
    function loadMetadataI18n(successCallback, errorCallback) {

        serviceClient.loadLocalFiltersI18Metadata(i18nMetadata => {

            const tagsI18n = i18nMetadata.tags;
            const filtersI18n = i18nMetadata.filters;
            const groupsI18n = i18nMetadata.groups;

            for (let i = 0; i < tags.length; i++) {
                applyFilterTagLocalization(tags[i], tagsI18n);
            }

            for (let j = 0; j < filters.length; j++) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            for (let k = 0; k < groups.length; k++) {
                applyGroupLocalization(groups[k], groupsI18n);
            }

            log.info('Filters i18n metadata loaded');
            successCallback();

        }, errorCallback);
    }

    /**
     * Localize tag
     * @param tag
     * @param i18nMetadata
     * @private
     */
    function applyFilterTagLocalization(tag, i18nMetadata) {
        const tagId = tag.tagId;
        const localizations = i18nMetadata[tagId];
        if (localizations) {
            const locale = i18n.normalize(localizations, app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                tag.name = localization.name;
                tag.description = localization.description;
            }
        }
    }

    /**
     * Localize group
     * @param group
     * @param i18nMetadata
     * @private
     */
    function applyGroupLocalization(group, i18nMetadata) {
        const groupId = group.groupId;
        const localizations = i18nMetadata[groupId];
        if (localizations) {
            const locale = i18n.normalize(localizations, app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                group.groupName = localization.name;
            }
        }
    }

    /**
     * Localize filter
     * @param filter
     * @param i18nMetadata
     * @private
     */
    function applyFilterLocalization(filter, i18nMetadata) {
        const filterId = filter.filterId;
        const localizations = i18nMetadata[filterId];
        if (localizations) {
            const locale = i18n.normalize(localizations, app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                filter.name = localization.name;
                filter.description = localization.description;
            }
        }
    }

    /**
     * Initialize subscription service, loading local filters metadata
     *
     * @param callback Called on operation success
     */
    const init = callback => {

        const errorCallback = (request, cause) => {
            log.error('Error loading metadata, cause: {0} {1}', request.statusText, cause);
        };

        loadMetadata(() => {
            loadMetadataI18n(callback, errorCallback);
        }, errorCallback);
    };

    /**
     * @returns Array of Filters metadata
     */
    const getFilters = () => filters;

    /**
     * Gets filter metadata by filter identifier
     */
    const getFilter = filterId => filtersMap[filterId];

    /**
     * @returns Array of Tags metadata
     */
    const getTags = () => tags;

    /**
     * @returns Array of Groups metadata
     */
    const getGroups = () => groups;

    /**
     * @returns Group metadata
     */
    const getGroup = (groupId) => groupsMap[groupId];

    /**
     * If group has enabled status true or false
     *
     * @param groupId
     * @returns {boolean}
     */
    const groupHasEnabledStatus = (groupId) => {
        const group = groupsMap[groupId];
        return group && typeof group.enabled !== 'undefined';
    };

    /**
     * Gets list of filters for the specified languages
     *
     * @param locale Locale to check
     * @returns {Array} List of filters identifiers
     */
    const getFilterIdsForLanguage = locale => {
        if (!locale) {
            return [];
        }

        const filterIds = [];
        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            const languages = filter.languages;
            if (languages && languages.length > 0) {
                const locale = i18n.normalize(languages, app.getLocale());
                if (locale) {
                    filterIds.push(filter.filterId);
                }
            }
        }

        return filterIds;
    };

    return {
        init: init,
        getFilterIdsForLanguage: getFilterIdsForLanguage,
        getTags: getTags,
        getGroups: getGroups,
        getGroup: getGroup,
        groupHasEnabledStatus: groupHasEnabledStatus,
        getFilters: getFilters,
        getFilter: getFilter,
        createSubscriptionFilterFromJSON: createSubscriptionFilterFromJSON,
        updateCustomFilter: updateCustomFilter
    };

})();

