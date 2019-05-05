const log = require('../utils/log');
const config = require('config');
const rulesStorage = require('../storage/rules-storage');
const collections = require('../utils/collections');
const listeners = require('../../notifier');
const events = require('../../events');

/**
 * Filter rules service
 */
module.exports = (() => {

    'use strict';

    const USER_FILTER_ID = config.get('AntiBannerFiltersId').USER_FILTER_ID;

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
     * Saves updated filter rules to the storage.
     *
     * @param filterId Filter id
     * @param events Events (what has changed?)
     * @private
     */
    const processSaveFilterRulesToStorageEvents = (filterId, eventsToProcess) => {

        return new Promise((resolve) => {
            rulesStorage.read(filterId, function (loadedRulesText) {

                for (let i = 0; i < eventsToProcess.length; i++) {

                    if (!loadedRulesText) {
                        loadedRulesText = [];
                    }

                    const event = eventsToProcess[i];
                    const eventType = event.event;
                    const eventRules = event.rules;

                    switch (eventType) {
                        case events.ADD_RULES:
                            loadedRulesText = loadedRulesText.concat(eventRules);
                            log.debug("Add {0} rules to filter {1}", eventRules.length, filterId);
                            break;
                        case events.REMOVE_RULE:
                            const actionRule = eventRules[0];
                            collections.removeAll(loadedRulesText, actionRule);
                            log.debug("Remove {0} rule from filter {1}", actionRule, filterId);
                            break;
                        case events.UPDATE_FILTER_RULES:
                            loadedRulesText = eventRules;
                            log.debug("Update filter {0} rules count to {1}", filterId, eventRules.length);
                            break;
                    }
                }

                log.debug("Save {0} rules to filter {1}", loadedRulesText.length, filterId);
                rulesStorage.write(filterId, loadedRulesText, function () {
                    resolve();
                    if (filterId === USER_FILTER_ID) {
                        listeners.notifyListeners(events.UPDATE_USER_FILTER_RULES);
                    }
                });
            });
        });
    };

    const MASK_SCRIPT_RULE = "#%#";
    const MASK_CSS_COSMETIC_RULE = "#$#";
    const MASK_CSS_COSMETIC_RULE_EXCEPTION = "#@$#";
    const OPTIONS_DELIMITER = "$";
    const REPLACE_OPTION = "replace";

    /**
     * If rules is trusted or not
     * Untrusted rules are $replace or JS
     *
     * @param ruleText
     */
    const isTrustedRule = (ruleText) => {
        if (ruleText.includes(MASK_SCRIPT_RULE)) {
            return false;
        }

        const optionsDelimiterIndex = ruleText.indexOf(OPTIONS_DELIMITER);
        if (optionsDelimiterIndex >= 0) {
            const replaceOptionIndex = ruleText.indexOf(REPLACE_OPTION + '=');
            if (replaceOptionIndex > optionsDelimiterIndex) {
                return false;
            }
        }

        return true;
    };

    /**
     * If rules is banned
     * css rules with urls in style text
     *
     * @param ruleText
     */
    const isBannedRule = (ruleText) => {
        if (ruleText.includes(MASK_CSS_COSMETIC_RULE) ||
            ruleText.includes(MASK_CSS_COSMETIC_RULE_EXCEPTION)) {
            if (ruleText.toLowerCase().includes('url(')) {
                return true;
            }
        }

        return false;
    };

    return {
        loadFilterRulesFromStorage,
        loadUserRules,
        processSaveFilterRulesToStorageEvents,
        isTrustedRule,
        isBannedRule
    };
})();

