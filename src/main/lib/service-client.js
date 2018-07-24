const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const filterDownloader = require('filters-downloader');
const subscriptions = require('./subscriptions');

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
     * TODO: Move to app configuration
     */
    const settings = {

        // Base url of our backend server
        get backendUrl() {
            return "https://chrome.adtidy.org";
        },

        get apiKey() {
            return "4DDBE80A3DA94D819A00523252FB6380";
        },

        // Url for load filters metadata and rules
        get filtersUrl() {
            return 'https://filters.adtidy.org/extension/safari';
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
            return this.filtersUrl + '/filters.json?' + params.join('&');
        },

        // URL for user complaints on missed ads or malware/phishing websites
        get reportUrl() {
            return this.backendUrl + "/url-report.html";
        },

        // Folder that contains filters metadata and files with rules. 'filters' by default
        get localFiltersFolder() {
            return './filters';
        },
        // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
        get localFilterIds() {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        },

        /**
         * Returns extension params: clientId, version and locale
         */
        getExtensionParams: function () {
            //TODO: Properly setup parameters

            var clientId = encodeURIComponent('123123123');
            var locale = encodeURIComponent('en');
            var version = encodeURIComponent('1.0.0');
            var id = encodeURIComponent('123123123');
            var params = [];
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
     * Appends request key to url
     */
    const addKeyParameter = (url) => {
        return url + "&key=" + settings.apiKey;
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
            console.error('Error parse json {0}', ex);
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
                        return element.filterId == filterIds[i];
                    });

                    if (filter) {
                        filterMetadataList.push(subscriptions.createSubscriptionFilterFromJSON(filter));
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
            url = settings.localFiltersFolder + "/filter_" + filterId + ".txt";
            if (useOptimizedFilters) {
                url = settings.localFiltersFolder + "/filter_mobile_" + filterId + ".txt";
            }
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
     * Loads filter groups metadata
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadLocalFiltersMetadata = function (successCallback, errorCallback) {

        const url = settings.localFiltersFolder + '/filters.json';
        fs.readFile(url, "utf8", (err, data) => {
            if (err) {
                console.error(err);
                errorCallback();
            }

            successCallback(parseJson(data));
        });
    };

    /**
     * Loads filter groups metadata from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    const loadLocalFiltersI18Metadata = function (successCallback, errorCallback) {

        const url = settings.localFiltersFolder + '/filters_i18n.json';
        fs.readFile(url, "utf8", (err, data) => {
            if (err) {
                console.error(err);
                errorCallback();
            }

            successCallback(parseJson(data));
        });
    };

    /**
     * Sends feedback from the user to our server
     *
     * @param url           URL
     * @param messageType   Message type
     * @param comment       Message text
     */
    const sendUrlReport = function (url, messageType, comment) {

        let params = "url=" + encodeURIComponent(url);
        params += "&messageType=" + encodeURIComponent(messageType);
        if (comment) {
            params += "&comment=" + encodeURIComponent(comment);
        }
        params = addKeyParameter(params);

        const request = new XMLHttpRequest();
        request.open('POST', settings.reportUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * Allows to receive response headers from the request to the given URL
     * @param url URL
     * @param callback Callback with headers or null in the case of error
     */
    const getResponseHeaders = function (url, callback) {
        executeRequestAsync(url, 'text/plain', function (request) {
            const arr = request.getAllResponseHeaders().trim().split(/[\r\n]+/);
            const headers = arr.map(function (line) {
                const parts = line.split(': ');
                const header = parts.shift();
                const value = parts.join(': ');
                return {
                    name: header,
                    value: value
                };
            });
            callback(headers);
        }, function (request) {
            console.error("Error retrieved response from {0}, cause: {1}", url, request.statusText);
            callback(null);
        })
    };

    return {

        loadFiltersMetadata: loadFiltersMetadata,
        loadFilterRules: loadFilterRules,

        loadFilterRulesBySubscriptionUrl: loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata: loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata: loadLocalFiltersI18Metadata,

        sendUrlReport: sendUrlReport,

        getResponseHeaders: getResponseHeaders
    };

})();
