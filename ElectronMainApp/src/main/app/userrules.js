const config = require('config');
const settings = require('./settings-manager');
const listeners = require('../notifier');
const events = require('../events');
const rulesStorage = require('./storage/rules-storage');

/**
 * Class for manage user rules
 */
module.exports = (function () {
    'use strict';

    const { USER_FILTER_ID } = config.get('AntiBannerFiltersId');

    const userFilter = { filterId: USER_FILTER_ID };

    /**
     * Save user rules text to storage
     * @param content Rules text
     */
    const updateUserRulesText = function (content) {
        if (!settings.isUserrulesEnabled()) {
            settings.changeUserrulesState(true);
        }

        const lines = content.split('\n') || [];
        rulesStorage.write(USER_FILTER_ID, lines, () => {
            listeners.notifyListeners(events.UPDATE_USER_FILTER_RULES);
            listeners.notifyListeners(events.UPDATE_FILTER_RULES, userFilter, lines);
        });
    };

    /**
     * Loads user rules from storage
     * @param callback Callback function
     */
    const getUserRules = function (callback) {
        rulesStorage.read(USER_FILTER_ID, (rules) => {
            if (callback) {
                callback(rules || []);
            }
        });
    };

    /**
     * Loads user rules text from storage
     * @param callback Callback function
     */
    const getUserRulesText = function (callback) {
        if (settings.isUserrulesEnabled()) {
            getUserRules((rules) => {
                const rulesText = rules.join('\n');
                if (callback) {
                    callback(rulesText);
                }
            });
        } else if (callback) {
            callback('');
        }
    };

    return {
        updateUserRulesText,
        getUserRulesText,
        getUserRules,
    };
})();
