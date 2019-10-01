const config = require('config');
const listeners = require('../../notifier');
const events = require('../../events');
const settings = require('../settings-manager');
const antibanner = require('../antibanner');
const whitelist = require('../whitelist');
const log = require('../utils/log');
const concurrent = require('../utils/concurrent');
const {groupRules, rulesGroupsBundles, filterGroupsBundles} = require('./rule-groups');
const {requireTaskPool} = require('electron-remote');

/**
 * Safari Content Blocker Adapter
 *
 * @type {{updateContentBlocker}}
 */
module.exports = (function () {

    const RULES_LIMIT = 50000;
    const DEBOUNCE_PERIOD = 500;

    const emptyBlockerJSON = [
        {
            "action": {
                "type": "ignore-previous-rules"
            },
            "trigger": {
                "url-filter": "none"
            }
        }
    ];

    /**
     * Load content blocker
     */
    const updateContentBlocker = () => {

        loadRules(async rules => {

            const grouped = groupRules(rules);
            let overlimit = false;

            for (let group of grouped) {
                let json = emptyBlockerJSON;

                const rulesTexts = group.rules.map(x => x.ruleText);
                const result = await jsonFromRules(rulesTexts, false);
                if (result && result.converted) {
                    json = JSON.parse(result.converted);
                    if (result.overLimit) {
                        overlimit = true;
                    }
                }

                const info = {
                    rulesCount: group.rules.length,
                    bundleId: rulesGroupsBundles[group.key],
                    overlimit: result && result.overLimit,
                    filterGroups: group.filterGroups,
                    hasError: false
                };

                setSafariContentBlocker(rulesGroupsBundles[group.key], json, info);
            }

            const advancedBlocking = await setAdvancedBlocking(rules.map(x => x.ruleText));

            listeners.notifyListeners(events.CONTENT_BLOCKER_UPDATED, {
                rulesCount: rules.length,
                rulesOverLimit: overlimit,
                advancedBlockingRulesCount: advancedBlocking.length
            });

        });
    };

    /**
     * Runs converter method for rules
     *
     * @param rules array of rules
     * @param advancedBlocking if we need advanced blocking content
     */
    const jsonFromRules = async (rules, advancedBlocking) => {
        const converterModule = requireTaskPool(require.resolve('../libs/JSConverter'));

        const result = await converterModule.jsonFromFilters(rules, RULES_LIMIT, false, advancedBlocking);
        return result;
    };

    /**
     * Activates advanced blocking json
     *
     * @param rules
     * @return {Array}
     */
    const setAdvancedBlocking = async (rules) => {
        const result = await jsonFromRules(rules, true);
        const advancedBlocking = result ? JSON.parse(result.advancedBlocking) : [];

        setSafariContentBlocker(rulesGroupsBundles["advancedBlocking"], advancedBlocking);

        return advancedBlocking;
    };

    /**
     * Load rules from requestFilter and WhiteListService
     * @private
     */
    const loadRules = concurrent.debounce((callback) => {

        if (settings.isFilteringDisabled()) {
            log.info('Disabling content blocker.');
            callback(null);
            return;
        }

        log.info('Loading content blocker.');

        let rules = antibanner.getRules();

        log.info('Rules loaded: {0}', rules.length);
        if (settings.isDefaultWhiteListMode()) {
            rules = rules.concat(whitelist.getRules().map(r => {
                return { filterId: 0, ruleText: r }
            }));
        } else {
            const invertedWhitelistRule = constructInvertedWhitelistRule();
            if (invertedWhitelistRule) {
                rules = rules.concat({
                    filterId: 0, ruleText: invertedWhitelistRule
                });
            }
        }

        callback(rules);

    }, DEBOUNCE_PERIOD);

    /**
     * Activates json for bundle
     *
     * @param bundleId
     * @param json
     * @param info
     */
    const setSafariContentBlocker = (bundleId, json, info) => {
        try {
            log.info(`Setting content blocker json for ${bundleId}. Length=${json.length};`);

            listeners.notifyListeners(events.CONTENT_BLOCKER_UPDATE_REQUIRED, {
                bundleId,
                json,
                info
            });
        } catch (ex) {
            log.error(`Error while setting content blocker ${bundleId}: ` + ex);
        }
    };

    /**
     * Constructs rule for inverted whitelist
     *
     * @private
     */
    const constructInvertedWhitelistRule = () => {
        const domains = whitelist.getWhiteListDomains();
        let invertedWhitelistRule = '@@||*$document';
        if (domains && domains.length > 0) {
            invertedWhitelistRule += ",domain=";
            let i = 0;
            const len = domains.length;
            for (; i < len; i++) {
                if (i > 0) {
                    invertedWhitelistRule += '|';
                }

                invertedWhitelistRule += '~' + domains[i];
            }
        }

        return invertedWhitelistRule;
    };

    /**
     * Rules info cache object
     *
     * @type {{}}
     */
    const contentBlockersInfoCache = {};

    /**
     * Saves rules info
     *
     * @param bundleId
     * @param info
     */
    const saveContentBlockerInfo = (bundleId, info) => {
          contentBlockersInfoCache[bundleId] = info;
    };

    /**
     * Returns rules info
     */
    const getContentBlockersInfo = () => {
        const groupsBundles = filterGroupsBundles();
        for (let extension of groupsBundles) {
            extension.rulesInfo = contentBlockersInfoCache[extension.bundleId]
        }

        return groupsBundles;
    };

    // Subscribe to cb extensions update event
    listeners.addListener(function (event, info) {
        if (event === events.CONTENT_BLOCKER_EXTENSION_UPDATED) {
            if (info && info.bundleId) {
                saveContentBlockerInfo(info.bundleId, info);
            }
        }
    });

    return {
        updateContentBlocker,
        getContentBlockersInfo
    };

})();

