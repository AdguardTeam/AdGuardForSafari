const settings  = require('./settings-manager');
const listeners = require('../notifier');
const localStorage = require('./utils/storage');

/**
 * Whitelist
 *
 * @type {{init, getRules, getWhiteListDomains, getWhiteListedDomains, getBlockListedDomains, findWhiteListRule, whiteListUrl, unWhiteListUrl, updateWhiteListDomains, configure, isDefaultMode, changeDefaultWhiteListMode}}
 */
module.exports = (function () {

    const WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    const BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    /**
     * Returns whitelist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    const isDefaultWhiteListMode = () => {
        return settings.isDefaultWhiteListMode();
    };

    const lazyGet = function (object, prop, calculateFunc) {
        let cachedProp = '_' + prop;
        if (cachedProp in object) {
            return object[cachedProp];
        }
        let value = calculateFunc.apply(object);
        object[cachedProp] = value;
        return value;
    };

    /**
     * Clear cached property
     * @param object Object
     * @param prop Original property name
     */
    const lazyGetClear = function (object, prop) {
        delete object['_' + prop];
    };

    const removeAll = function (collection, element) {
        if (!element || !collection) {
            return;
        }
        for (let i = collection.length - 1; i >= 0; i--) {
            if (collection[i] === element) {
                collection.splice(i, 1);
            }
        }
    };

    /**
     * Retrieves hostname from URL
     */
    const getHost = function (url) {

        if (!url) {
            return null;
        }

        let firstIdx = url.indexOf("//");
        if (firstIdx === -1) {
            /**
             * It's non hierarchical structured URL (e.g. stun: or turn:)
             * https://tools.ietf.org/html/rfc4395#section-2.2
             * https://tools.ietf.org/html/draft-nandakumar-rtcweb-stun-uri-08#appendix-B
             */
            firstIdx = url.indexOf(":");
            if (firstIdx === -1) {
                return null;
            }
            firstIdx = firstIdx - 1;
        }

        const nextSlashIdx = url.indexOf("/", firstIdx + 2);
        const startParamsIdx = url.indexOf("?", firstIdx + 2);

        let lastIdx = nextSlashIdx;
        if (startParamsIdx > 0 && (startParamsIdx < nextSlashIdx || nextSlashIdx < 0)) {
            lastIdx = startParamsIdx;
        }

        const host = lastIdx === -1 ? url.substring(firstIdx + 2) : url.substring(firstIdx + 2, lastIdx);

        const portIndex = host.indexOf(":");
        return portIndex === -1 ? host : host.substring(0, portIndex);
    };

    /**
     * Read domains and initialize filters lazy
     */
    const whiteListDomainsHolder = {
        get domains() {
            return lazyGet(whiteListDomainsHolder, 'domains', function () {
                return getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };

    const blockListDomainsHolder = {
        get domains() {
            return lazyGet(blockListDomainsHolder, 'domains', function () {
                return getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };

    function notifyWhiteListUpdated(options) {
        listeners.notifyListeners(listeners.UPDATE_WHITELIST_FILTER_RULES);
        listeners.notifyListeners(listeners.SYNC_REQUIRED, options);
    }

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createWhiteListRule(domain) {
        if (!domain) {
            return null;
        }
        return "@@//" + domain + "$document";
    }

    /**
     * Adds domain to array of whitelist domains
     * @param domain
     */
    function addDomainToWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultWhiteListMode()) {
            whiteListDomainsHolder.add(domain);
        } else {
            blockListDomainsHolder.add(domain);
        }
    }

    /**
     * Remove domain form whitelist domains
     * @param domain
     */
    function removeDomainFromWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultWhiteListMode()) {
            removeAll(whiteListDomainsHolder.domains, domain);
        } else {
            removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Remove domain from whitelist
     * @param domain
     */
    function removeFromWhiteList(domain) {
        removeDomainFromWhiteList(domain);
        saveDomainsToLocalStorage();
        notifyWhiteListUpdated();
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(whiteListDomainsHolder.domains));
        localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP, JSON.stringify(blockListDomainsHolder.domains));
    }

    /**
     * Retrieve domains from local storage
     * @param prop
     * @returns {Array}
     */
    function getDomainsFromLocalStorage(prop) {
        let domains = [];
        try {
            const json = localStorage.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {
            console.error("Error retrieve whitelist domains {0}, cause {1}", prop, ex);
        }
        return domains;
    }

    /**
     * Adds domain to whitelist
     * @param domain
     */
    function addToWhiteList(domain) {
        const rule = createWhiteListRule(domain);
        if (rule) {
            addDomainToWhiteList(domain);
            saveDomainsToLocalStorage();
            notifyWhiteListUpdated();
        }
    }

    /**
     * Changes whitelist mode
     * @param defaultMode
     */
    const changeDefaultWhiteListMode = function (defaultMode) {
        settings.changeDefaultWhiteListMode(defaultMode);
        notifyWhiteListUpdated();
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    const whiteListUrl = function (url) {
        const domain = getHost(url);
        if (isDefaultWhiteListMode()) {
            addToWhiteList(domain);
        } else {
            removeFromWhiteList(domain);
        }
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    const unWhiteListUrl = function (url) {
        const domain = getHost(url);
        if (isDefaultWhiteListMode()) {
            removeFromWhiteList(domain);
        } else {
            addToWhiteList(domain);
        }
    };

    /**
     * Updates domains in whitelist
     * @param domains
     */
    const updateWhiteListDomains = function (domains) {
        domains = domains || [];
        if (isDefaultWhiteListMode()) {
            clearWhiteListed();
            addWhiteListed(domains);
        } else {
            clearBlockListed();
            addBlockListed(domains);
        }
        notifyWhiteListUpdated();
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    const addWhiteListed = function (domains) {
        if (!domains) {
            return;
        }
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            whiteListDomainsHolder.add(domain);
        }
        saveDomainsToLocalStorage();
    };

    /**
     * Add domains to blocklist
     * @param domains
     */
    const addBlockListed = function (domains) {
        if (!domains) {
            return;
        }
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            blockListDomainsHolder.add(domain);
        }
        saveDomainsToLocalStorage();
    };

    /**
     * Clear whitelisted only
     */
    const clearWhiteListed = function () {
        localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
        lazyGetClear(whiteListDomainsHolder, 'domains');
    };

    /**
     * Clear blocklisted only
     */
    const clearBlockListed = function () {
        localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
        lazyGetClear(blockListDomainsHolder, 'domains');
    };

    /**
     * Configures whitelist service
     * @param whitelist Whitelist domains
     * @param blocklist Blocklist domains
     * @param whiteListMode Whitelist mode
     * @param options
     */
    const configure = function (whitelist, blocklist, whiteListMode, options) {
        clearWhiteListed();
        clearBlockListed();
        addWhiteListed(whitelist || []);
        addBlockListed(blocklist || []);
        settings.changeDefaultWhiteListMode(whiteListMode);
        notifyWhiteListUpdated(options);
    };

    /**
     * Returns the array of whitelist domains
     */
    const getWhiteListDomains = function () {
        if (isDefaultWhiteListMode()) {
            return whiteListDomainsHolder.domains;
        } else {
            return blockListDomainsHolder.domains;
        }
    };

    /**
     * Returns the array of whitelisted domains
     */
    const getWhiteListedDomains = function () {
        return whiteListDomainsHolder.domains;
    };

    /**
     * Returns the array of blocklisted domains, inverted mode
     */
    const getBlockListedDomains = function () {
        return blockListDomainsHolder.domains;
    };

    /**
     * Returns the array of loaded rules
     */
    const getRules = function () {
        //TODO: blockListFilter
        const result = [];
        getWhiteListedDomains().forEach((d) => {
            let rule = createWhiteListRule(d);
            if (rule) {
                result.push(rule);
            }
        });

        return result;
    };

    /**
     * Initializes whitelist filter
     */
    const init = function () {
        /**
         * Access to whitelist/blacklist domains before the proper initialization of localStorage leads to wrong caching of its values
         * To prevent it we should clear cached values
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/933
         */
        lazyGetClear(whiteListDomainsHolder, 'domains');
        lazyGetClear(blockListDomainsHolder, 'domains');
    };

    return {

        init: init,
        getRules: getRules,
        getWhiteListDomains: getWhiteListDomains,

        getWhiteListedDomains: getWhiteListedDomains,
        getBlockListedDomains: getBlockListedDomains,

        whiteListUrl: whiteListUrl,
        unWhiteListUrl: unWhiteListUrl,

        updateWhiteListDomains: updateWhiteListDomains,

        configure: configure,

        isDefaultMode: isDefaultWhiteListMode,
        changeDefaultWhiteListMode: changeDefaultWhiteListMode
    };

})();

