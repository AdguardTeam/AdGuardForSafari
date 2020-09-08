const config = require('config');
const serviceClient = require('./service-client');
const filterMetadata = require('./filter-metadata');
const localStorage = require('../storage/storage');
const i18 = require('../../../utils/i18n');
const i18n = require('../utils/i18n');
const log = require('../utils/log');
const app = require('../app');

const { CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER, CUSTOM_FILTERS_JSON_KEY } = require('./constants');

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
    const { CUSTOM_FILTERS_GROUP_ID } = config.get('AntiBannerFilterGroupsId');

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
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, '+$1:$2'));
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
     * Create tag from object
     * @param tag Object
     * @returns {FilterTag}
     */
    function createFilterTagFromJSON(tag) {
        const tagId = parseInt(tag.tagId, 10);
        const { keyword } = tag;

        return new FilterTag(tagId, keyword);
    }

    /**
     * Create group from object
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    function createSubscriptionGroupFromJSON(group) {
        const groupId = parseInt(group.groupId, 10);
        const defaultGroupName = group.groupName;
        const displayNumber = parseInt(group.displayNumber, 10);

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    }

    /**
     * Create filter from object
     * @param filter Object
     */
    const createSubscriptionFilterFromJSON = (filter) => {
        const filterId = parseInt(filter.filterId, 10);
        const groupId = parseInt(filter.groupId, 10);
        const defaultName = filter.name;
        const defaultDescription = filter.description;
        const {
            homepage, version, subscriptionUrl, languages,
        } = filter;
        const timeUpdated = parseTimeUpdated(filter.timeUpdated);
        const expires = parseInt(filter.expires, 10);
        const displayNumber = parseInt(filter.displayNumber, 10);
        const { tags } = filter;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new filterMetadata.SubscriptionFilter(
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
    };

    /**
     * Load groups and filters metadata
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function loadMetadata(successCallback, errorCallback) {
        log.info('Loading filters metadata..');

        serviceClient.loadLocalFiltersMetadata((metadata) => {
            tags = [];
            groups = [];
            groupsMap = {};
            filters = [];
            filtersMap = {};

            for (let i = 0; i < metadata.tags.length; i += 1) {
                tags.push(createFilterTagFromJSON(metadata.tags[i]));
            }

            for (let j = 0; j < metadata.filters.length; j += 1) {
                const filter = createSubscriptionFilterFromJSON(metadata.filters[j]);
                filters.push(filter);
                filtersMap[filter.filterId] = filter;
            }

            for (let k = 0; k < metadata.groups.length; k += 1) {
                const group = createSubscriptionGroupFromJSON(metadata.groups[k]);
                groups.push(group);
                groupsMap[group.groupId] = group;
            }

            const localizedCustomGroupName = i18.__('filters_group_custom.message');
            const customFiltersGroup = new SubscriptionGroup(
                CUSTOM_FILTERS_GROUP_ID,
                localizedCustomGroupName,
                CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER
            );
            groups.push(customFiltersGroup);
            groupsMap[customFiltersGroup.groupId] = customFiltersGroup;

            // Load custom filters
            const customFilters = JSON.parse(localStorage.getItem(CUSTOM_FILTERS_JSON_KEY));
            customFilters.forEach((f) => {
                const filter = createSubscriptionFilterFromJSON(f);
                filter.customUrl = f.customUrl;
                filter.rulesCount = f.rulesCount;
                filter.trusted = f.trusted;

                filters.push(filter);
                filtersMap[filter.filterId] = filter;
            });

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
        log.info('Loading filters i18n metadata..');

        serviceClient.loadLocalFiltersI18Metadata((i18nMetadata) => {
            log.info('Filters i18n metadata read');

            const tagsI18n = i18nMetadata.tags;
            const filtersI18n = i18nMetadata.filters;
            const groupsI18n = i18nMetadata.groups;

            for (let i = 0; i < tags.length; i += 1) {
                applyFilterTagLocalization(tags[i], tagsI18n);
            }

            log.debug('Filters i18n metadata - tags');

            for (let j = 0; j < filters.length; j += 1) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            log.debug('Filters i18n metadata - filters');

            for (let k = 0; k < groups.length; k += 1) {
                applyGroupLocalization(groups[k], groupsI18n);
            }

            log.debug('Filters i18n metadata - groups');

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
        const { tagId } = tag;
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
        const { groupId } = group;
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
        const { filterId } = filter;
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
    const init = (callback) => {
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
     * @returns Object of Filters metadata
     */
    const getFiltersMap = () => filtersMap;

    /**
     * Gets filter metadata by filter identifier
     */
    const getFilter = (filterId) => filtersMap[filterId];

    /**
     * Removes filter metadata by id
     * @param filterId
     */
    const removeFilter = (filterId) => {
        filters = filters.filter((f) => f.filterId !== filterId);
        delete filtersMap[filterId];
    };

    /**
     * Updates filter metadata
     * @param filter
     */
    const updateFilters = (filter) => {
        removeFilter(filter.filterId);
        filters.push(filter);
        filtersMap[filter.filterId] = filter;
    };

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
     * If group's status was ever enabled or disabled
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
    const getFilterIdsForLanguage = (locale) => {
        if (!locale) {
            return [];
        }

        const filterIds = [];
        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            const { languages } = filter;
            if (languages && languages.length > 0) {
                const detectedLocale = i18n.normalize(languages, locale);
                if (detectedLocale) {
                    filterIds.push(filter.filterId);
                }
            }
        }

        return filterIds;
    };

    return {
        init,
        getFilterIdsForLanguage,
        getTags,
        getGroups,
        getGroup,
        groupHasEnabledStatus,
        getFilters,
        getFiltersMap,
        getFilter,
        createSubscriptionFilterFromJSON,
        removeFilter,
        updateFilters,
    };
})();
