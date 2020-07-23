const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const filterDownloader = require('filters-downloader');
const config = require('config');
const path = require('path');
const log = require('../utils/log');
const app = require('../app');
const appPack = require('../../../utils/app-pack');

/**
 * Backend service client
 *
 * Class for working with our backend server.
 * All requests sent by this class are covered in the privacy policy:
 * http://adguard.com/en/privacy.html#browsers
 */
module.exports = (function () {

    'use strict';

    /**
     * Configuration
     */
    const settings = {

        // Base url of our backend server
        get backendUrl() {
            return config.get('backendUrl');
        },

        get apiKey() {
            return config.get('backendApiKey');
        },

        // Url for load filters metadata and rules
        get filtersUrl() {
            return config.get('filtersUrl');
        },

        // URL for downloading AG filters
        get filterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}.txt";
        },

        // URL for downloading optimized AG filters
        get optimizedFilterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}_optimized.txt";
        },

        // URL for checking filter updates
        get filtersMetadataUrl() {
            const params = this.getExtensionParams();
            return this.filtersUrl + '/filters.js?' + params.join('&');
        },

        // Folder that contains filters metadata and files with rules. 'filters' by default
        get localFiltersFolder() {
            return appPack.resourcePath(config.get('localFiltersFolder'));
        },
        // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
        get localFilterIds() {
            return config.get('localFilterIds');
        },

        /**
         * Returns extension params: clientId, version and locale
         */
        getExtensionParams: function () {
            const clientId = encodeURIComponent(app.getClientId());
            const locale = encodeURIComponent(app.getLocale());
            const version = encodeURIComponent(app.getVersion());
            const id = encodeURIComponent(app.getId());

            const params = [];
            params.push('v=' + version);
            params.push('cid=' + clientId);
            params.push('lang=' + locale);
            params.push('id=' + id);
            return params;
        }
    };

    /**
     * FilterDownloader constants
     */
    const FilterCompilerConditionsConstants = {
        adguard: true,
        adguard_ext_chromium: false,
        adguard_ext_firefox: false,
        adguard_ext_edge: false,
        adguard_ext_safari: true,
        adguard_ext_opera: false
    };

    /**
     * Loading subscriptions map
     */
    const loadingSubscriptions = Object.create(null);

    /**
     * Executes async request
     * @param url Url
     * @param contentType Content type
     * @param successCallback success callback
     * @param errorCallback error callback
     */
    const executeRequestAsync = (url, contentType, successCallback, errorCallback) => {

        const request = new XMLHttpRequest();
        try {
            request.open('GET', url);
            request.setRequestHeader('Content-type', contentType);
            request.setRequestHeader('Pragma', 'no-cache');
            //request.overrideMimeType(contentType);
            request.mozBackgroundRequest = true;
            if (successCallback) {
                request.onload = function () {
                    successCallback(request);
                };
            }
            if (errorCallback) {
                const errorCallbackWrapper = function () {
                    errorCallback(request);
                };
                request.onerror = errorCallbackWrapper;
                request.onabort = errorCallbackWrapper;
                request.ontimeout = errorCallbackWrapper;
            }
            request.send(null);
        } catch (ex) {
            if (errorCallback) {
                errorCallback(request, ex);
            }
        }
    };

    /**
     * URL for downloading AG filter
     *
     * @param filterId Filter identifier
     * @param useOptimizedFilters
     * @private
     */
    const getUrlForDownloadFilterRules = (filterId, useOptimizedFilters) => {
        const url = useOptimizedFilters ? settings.optimizedFilterRulesUrl : settings.filterRulesUrl;
        return url.replace(/{filter_id}/g, filterId);
    };

    /**
     * Safe json parsing
     * @param text
     * @private
     */
    const parseJson = (text) => {
        try {
            return JSON.parse(text);
        } catch (ex) {
            log.error('Error parse json {0}', ex);
            return null;
        }
    };

    /**
     * Load metadata of the specified filters
     *
     * @param filterIds         Filters identifiers
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadFiltersMetadata = function (filterIds, successCallback, errorCallback) {

        if (!filterIds || filterIds.length === 0) {
            successCallback([]);
            return;
        }

        const success = function (response) {
            if (response && response.responseText) {
                let metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, "invalid response");
                    return;
                }
                const filterMetadataList = [];
                for (let i = 0; i < filterIds.length; i++) {
                    const filter = metadata.filters.find(function(element) {
                        return element.filterId === filterIds[i];
                    });

                    if (filter) {
                        filterMetadataList.push(filter);
                    }
                }
                successCallback(filterMetadataList);
            } else {
                errorCallback(response, "empty response");
            }
        };

        executeRequestAsync(settings.filtersMetadataUrl, "application/json", success, errorCallback);
    };

    /**
     * Downloads filter rules by filter ID
     *
     * @param filterId            Filter identifier
     * @param forceRemote         Force download filter rules from remote server
     * @param useOptimizedFilters    Download optimized filters flag
     * @param successCallback    Called on success
     * @param errorCallback        Called on error
     */
    const loadFilterRules = function (filterId, forceRemote, useOptimizedFilters, successCallback, errorCallback) {

        let url;
        if (forceRemote || settings.localFilterIds.indexOf(filterId) < 0) {
            url = getUrlForDownloadFilterRules(filterId, useOptimizedFilters);
        } else {
            url = settings.localFiltersFolder + "/" + filterId + ".txt";
            if (useOptimizedFilters) {
                url = settings.localFiltersFolder + "/" + filterId + "_optimized.txt";
            }

            url = path.resolve(url);
        }

        filterDownloader.download(url, FilterCompilerConditionsConstants).then(successCallback, errorCallback);
    };

    /**
     * Downloads filter rules frm url
     *
     * @param url               Subscription url
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadFilterRulesBySubscriptionUrl = function (url, successCallback, errorCallback) {

        if (url.startsWith('file://')) {
            url = path.resolve(url.replace('file://', ''));
        }

        if (url in loadingSubscriptions) {
            return;
        }
        loadingSubscriptions[url] = true;

        const success = function (lines) {
            delete loadingSubscriptions[url];

            if (lines[0].indexOf('[') === 0) {
                //[Adblock Plus 2.0]
                lines.shift();
            }

            successCallback(lines);
        };

        const error = function (cause) {
            delete loadingSubscriptions[url];
            errorCallback(cause);
        };

        filterDownloader.download(url, FilterCompilerConditionsConstants).then(success, error);
    };

    /**
     * Reads file from url then parses json
     *
     * @param url
     * @param successCallback
     */
    const readJsonFile = function (url, successCallback) {
        log.debug(`Reading file from ${url}`);

        const data = fs.readFileSync(url, { encoding: 'utf8'});
        log.debug('Data read');

        const json = parseJson(data);
        log.debug('Json parsed');

        successCallback(json);
    };

    /**
     * Load metadata of all filters
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadRemoteFiltersMetadata = function (successCallback, errorCallback) {

        const success = function (response) {
            if (response && response.responseText) {
                let metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, "invalid response");
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, "empty response");
            }
        };

        executeRequestAsync(settings.filtersMetadataUrl, "application/json", success, errorCallback);
    };

    /**
     * Loads filter groups metadata
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadLocalFiltersMetadata = function (successCallback, errorCallback) {
        const url = settings.localFiltersFolder + '/filters.json';
        readJsonFile(url, successCallback);
    };

    /**
     * Loads filter groups metadata from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadLocalFiltersI18Metadata = function (successCallback, errorCallback) {
        const url = settings.localFiltersFolder + '/filters_i18n.json';
        readJsonFile(url, successCallback);
    };

    return {

        loadFiltersMetadata: loadFiltersMetadata,
        loadFilterRules: loadFilterRules,

        loadFilterRulesBySubscriptionUrl: loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata: loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata: loadLocalFiltersI18Metadata,

        loadRemoteFiltersMetadata: loadRemoteFiltersMetadata
    };

})();
