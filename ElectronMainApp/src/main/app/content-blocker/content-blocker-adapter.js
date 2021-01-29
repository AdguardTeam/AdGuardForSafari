/* eslint-disable-next-line import/no-unresolved */
const { jsonFromRules, getConverterVersion } = require('safari-converter-lib');
const { resourcePath } = require('../../../utils/app-pack');
const listeners = require('../../notifier');
const events = require('../../events');
const settings = require('../settings-manager');
const antibanner = require('../antibanner');
const whitelist = require('../whitelist');
const log = require('../utils/log');
const concurrent = require('../utils/concurrent');
const { groupRules, rulesGroupsBundles, filterGroupsBundles } = require('./rule-groups');

const CONVERTER_TOOL_PATH = '../libs/ConverterTool';

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
            'action': {
                'type': 'ignore-previous-rules',
            },
            'trigger': {
                'url-filter': 'none',
            },
        },
    ];

    /**
     * Converts rules to json using converter api
     * @param {Array} rules
     * @param {boolean} advancedBlocking if we need advanced blocking content
     */
    const convertRulesToJson = async (rules, advancedBlocking) => {
        try {
            log.info(`ConverterTool version: ${getConverterVersion()}`);
            log.info(`Conversion of ${rules.length} rules started..`);
            const converterPath = resourcePath(CONVERTER_TOOL_PATH);
            log.info(`CONVERTER PATH: ${converterPath}`);

            const result = await jsonFromRules(rules, advancedBlocking, RULES_LIMIT, converterPath);
            return result;
        } catch (e) {
            log.error(`Unexpected error converting rules: ${e}`);
            return null;
        }
    };

    /**
     * Load content blocker
     */
    const updateContentBlocker = () => {
        loadRules(async (rules) => {
            const grouped = groupRules(rules);
            let overlimit = false;

            for (const group of grouped) {
                let json = JSON.stringify(emptyBlockerJSON);

                const info = {
                    rulesCount: 0,
                    bundleId: rulesGroupsBundles[group.key],
                    overlimit: false,
                    filterGroups: group.filterGroups,
                    hasError: false,
                };

                const groupRules = group.rules;
                if (groupRules && groupRules.length > 0) {
                    const rulesTexts = groupRules.map((x) => x.ruleText);
                    /* eslint-disable-next-line no-await-in-loop */
                    const result = await convertRulesToJson(rulesTexts, false);
                    if (result && result.converted && result.converted !== '[]') {
                        log.info(result?.message);

                        json = result.converted;
                        if (result.overLimit) {
                            overlimit = true;
                        }

                        info.rulesCount = result.totalConvertedCount;
                        info.overlimit = result.overLimit;
                    } else {
                        info.hasError = true;
                    }
                } else {
                    log.info(`No rules found for group: ${group.key}`);
                }

                setSafariContentBlocker(rulesGroupsBundles[group.key], json, info);
            }

            const advancedBlockingRulesCount = await setAdvancedBlocking(rules.map((x) => x.ruleText));

            const rulesWithoutComments = rules.filter((rule) => !rule.ruleText.startsWith('!')).length;

            listeners.notifyListeners(events.CONTENT_BLOCKER_UPDATED, {
                rulesCount: rulesWithoutComments,
                rulesOverLimit: overlimit,
                advancedBlockingRulesCount,
            });
        });
    };

    /**
     * Activates advanced blocking json
     *
     * @param rules array of rules
     * @return {int} rules count
     */
    const setAdvancedBlocking = async (rules) => {
        let advancedBlocking = '[]';
        const result = await convertRulesToJson(rules, true);
        if (result && result.advancedBlocking) {
            advancedBlocking = result.advancedBlocking;
        }

        setSafariContentBlocker(
            rulesGroupsBundles['advancedBlocking'],
            advancedBlocking,
            { rulesCount: result ? result.totalConvertedCount : 0 }
        );

        return result ? result.advancedBlockingConvertedCount : 0;
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
            rules = rules.concat(whitelist.getRules().map((r) => {
                return { filterId: 0, ruleText: r };
            }));
        } else {
            const invertedWhitelistRule = constructInvertedWhitelistRule();
            if (invertedWhitelistRule) {
                rules = rules.concat({
                    filterId: 0, ruleText: invertedWhitelistRule,
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
            log.info(`Setting content blocker json for ${bundleId}.`
                + `Rules count: ${info.rulesCount}. Json length=${json.length};`);

            listeners.notifyListeners(events.CONTENT_BLOCKER_UPDATE_REQUIRED, {
                bundleId,
                json,
                info,
            });
        } catch (ex) {
            log.error(`Error while setting content blocker ${bundleId}: ${ex}`);
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
            invertedWhitelistRule += ',domain=';
            let i = 0;
            const len = domains.length;
            for (; i < len; i += 1) {
                if (i > 0) {
                    invertedWhitelistRule += '|';
                }

                invertedWhitelistRule += `~${domains[i]}`;
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
        for (const extension of groupsBundles) {
            extension.rulesInfo = contentBlockersInfoCache[extension.bundleId];
        }

        return groupsBundles;
    };

    // Subscribe to cb extensions update event
    listeners.addListener((event, info) => {
        if (event === events.CONTENT_BLOCKER_EXTENSION_UPDATED) {
            if (info && info.bundleId) {
                saveContentBlockerInfo(info.bundleId, info);
            }
        }
    });

    return {
        updateContentBlocker,
        getContentBlockersInfo,
    };
})();
