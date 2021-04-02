const settings = require('./settings-manager');
const listeners = require('../notifier');
const events = require('../events');
const localStorage = require('./storage/storage');
const collections = require('./utils/collections');
const cache = require('./utils/cache');
const log = require('./utils/log');

/**
 * Allowlist
 *
 * @type {{init, getRules, getAllowlistDomains, getAllowlistedDomains, getBlockListedDomains, findAllowlistRule,
 * allowlistUrl, unAllowlistUrl, loadAllowlistDomains, configure, isDefaultMode, changeDefaultAllowlistMode}}
 */
module.exports = (function () {
    const WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    const BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    /**
     * Returns allowlist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    const isDefaultAllowlistMode = () => {
        return settings.isDefaultAllowlistMode();
    };

    /**
     * Retrieves hostname from URL
     */
    const getHost = function (url) {
        if (!url) {
            return null;
        }

        let firstIdx = url.indexOf('//');
        if (firstIdx === -1) {
            /**
             * It's non hierarchical structured URL (e.g. stun: or turn:)
             * https://tools.ietf.org/html/rfc4395#section-2.2
             * https://tools.ietf.org/html/draft-nandakumar-rtcweb-stun-uri-08#appendix-B
             */
            firstIdx = url.indexOf(':');
            if (firstIdx === -1) {
                return null;
            }
            firstIdx -= 1;
        }

        const nextSlashIdx = url.indexOf('/', firstIdx + 2);
        const startParamsIdx = url.indexOf('?', firstIdx + 2);

        let lastIdx = nextSlashIdx;
        if (startParamsIdx > 0 && (startParamsIdx < nextSlashIdx || nextSlashIdx < 0)) {
            lastIdx = startParamsIdx;
        }

        const host = lastIdx === -1 ? url.substring(firstIdx + 2) : url.substring(firstIdx + 2, lastIdx);

        const portIndex = host.indexOf(':');
        return portIndex === -1 ? host : host.substring(0, portIndex);
    };

    /**
     * Read domains and initialize filters lazy
     */
    const allowlistDomainsHolder = {
        get domains() {
            return cache.lazyGet(allowlistDomainsHolder, 'domains', () => {
                return getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
            });
        },
        add(domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        },
    };

    const blockListDomainsHolder = {
        get domains() {
            return cache.lazyGet(blockListDomainsHolder, 'domains', () => {
                return getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);
            });
        },
        add(domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        },
    };

    /* eslint-disable-next-line no-unused-vars */
    function notifyAllowlistUpdated(options) {
        listeners.notifyListeners(events.UPDATE_ALLOWLIST_FILTER_RULES);
    }

    /**
     * Create allowlist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createAllowlistRule(domain) {
        if (!domain) {
            return null;
        }

        // don't create rule for comments
        if (domain.startsWith('!')) {
            return null;
        }

        // https://github.com/AdguardTeam/AdGuardForSafari/issues/346
        if (domain.startsWith('localhost')) {
            return `@@${domain}$document`;
        }

        return `@@||${domain}$document`;
    }

    /**
     * Adds domain to array of allowlist domains
     * @param domain
     */
    function addDomainToAllowlist(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultAllowlistMode()) {
            allowlistDomainsHolder.add(domain);
        } else {
            blockListDomainsHolder.add(domain);
        }
    }

    /**
     * Remove domain form allowlist domains
     * @param domain
     */
    function removeDomainFromAllowlist(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultAllowlistMode()) {
            collections.removeAll(allowlistDomainsHolder.domains, domain);
        } else {
            collections.removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Remove domain from allowlist
     * @param domain
     */
    function removeFromAllowlist(domain) {
        removeDomainFromAllowlist(domain);
        saveDomainsToLocalStorage();
        notifyAllowlistUpdated();
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(allowlistDomainsHolder.domains));
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
            log.error('Error retrieve allowlist domains {0}, cause {1}', prop, ex);
        }
        return domains;
    }

    /**
     * Adds domain to allowlist
     * @param domain
     */
    function addToAllowlist(domain) {
        const rule = createAllowlistRule(domain);
        if (rule) {
            addDomainToAllowlist(domain);
            saveDomainsToLocalStorage();
            notifyAllowlistUpdated();
        }
    }

    /**
     * Changes allowlist mode
     * @param defaultMode
     */
    const changeDefaultAllowlistMode = function (defaultMode) {
        settings.changeDefaultAllowlistMode(defaultMode);
        notifyAllowlistUpdated();
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    const allowlistUrl = function (url) {
        const domain = getHost(url);
        if (isDefaultAllowlistMode()) {
            addToAllowlist(domain);
        } else {
            removeFromAllowlist(domain);
        }
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    const unAllowlistUrl = function (url) {
        const domain = getHost(url);
        if (isDefaultAllowlistMode()) {
            removeFromAllowlist(domain);
        } else {
            addToAllowlist(domain);
        }
    };

    /**
     * Updates domains in allowlist
     * @param domains
     */
    const updateAllowlistDomains = function (domains) {
        domains = domains || [];
        if (isDefaultAllowlistMode()) {
            clearAllowlisted();
            addAllowlisted(domains);
        } else {
            clearBlockListed();
            addBlockListed(domains);
        }
        notifyAllowlistUpdated();
    };

    /**
     * Add domains to allowlist
     * @param domains
     */
    const addAllowlisted = function (domains) {
        if (!domains) {
            return;
        }
        for (let i = 0; i < domains.length; i += 1) {
            const domain = domains[i];
            allowlistDomainsHolder.add(domain);
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
        for (let i = 0; i < domains.length; i += 1) {
            const domain = domains[i];
            blockListDomainsHolder.add(domain);
        }
        saveDomainsToLocalStorage();
    };

    /**
     * Clear allowlisted only
     */
    const clearAllowlisted = function () {
        localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
        cache.lazyGetClear(allowlistDomainsHolder, 'domains');
    };

    /**
     * Clear blocklisted only
     */
    const clearBlockListed = function () {
        localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
        cache.lazyGetClear(blockListDomainsHolder, 'domains');
    };

    /**
     * Configures allowlist service
     * @param allowlist Allowlist domains
     * @param blocklist Blocklist domains
     * @param allowlistMode Allowlist mode
     * @param options
     */
    const configure = function (allowlist, blocklist, allowlistMode, options) {
        clearAllowlisted();
        clearBlockListed();
        addAllowlisted(allowlist || []);
        addBlockListed(blocklist || []);
        settings.changeDefaultAllowlistMode(allowlistMode);
        notifyAllowlistUpdated(options);
    };

    /**
     * Returns the array of allowlisted domains
     */
    const getAllowlistedDomains = function () {
        return allowlistDomainsHolder.domains;
    };

    /**
     * Returns the array of blocklisted domains, inverted mode
     */
    const getBlockListedDomains = function () {
        return blockListDomainsHolder.domains;
    };

    /**
     * Returns the array of allowlist domains
     */
    const getAllowlistDomains = function () {
        if (isDefaultAllowlistMode()) {
            return getAllowlistedDomains();
        }
        return getBlockListedDomains();
    };

    /**
     * Returns the array of loaded rules
     */
    const getRules = function () {
        // TODO: blockListFilter
        const result = [];

        if (settings.isAllowlistEnabled()) {
            getAllowlistedDomains().forEach((d) => {
                const rule = createAllowlistRule(d);
                if (rule) {
                    result.push(rule);
                }
            });
        }

        return result;
    };

    /**
     * Finds if url is allowlisted
     *
     * @param url
     */
    const isAllowlisted = (url) => {
        if (!url) {
            return null;
        }

        const host = getHost(url);

        if (isDefaultAllowlistMode()) {
            return getAllowlistedDomains().indexOf(host) >= 0;
        }
        return getBlockListedDomains().indexOf(host) >= 0;
    };

    /**
     * Initializes allowlist filter
     */
    const init = function () {
        /**
         * Access to allowlist/blocklist domains before the proper initialization of localStorage
         * leads to wrong caching of its values
         * To prevent it we should clear cached values
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/933
         */
        cache.lazyGetClear(allowlistDomainsHolder, 'domains');
        cache.lazyGetClear(blockListDomainsHolder, 'domains');
    };

    return {

        init,
        getRules,
        getAllowlistDomains,

        getAllowlistedDomains,
        getBlockListedDomains,

        allowlistUrl,
        unAllowlistUrl,

        isAllowlisted,

        updateAllowlistDomains,

        configure,

        isDefaultMode: isDefaultAllowlistMode,
        changeDefaultAllowlistMode,
    };
})();
