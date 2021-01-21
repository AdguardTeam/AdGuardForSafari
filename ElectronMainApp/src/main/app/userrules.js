const config = require('config');
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
        const lines = content.split('\n') || [];
        rulesStorage.write(USER_FILTER_ID, lines, () => {
            listeners.notifyListeners(events.UPDATE_USER_FILTER_RULES);
            listeners.notifyListeners(events.UPDATE_FILTER_RULES, userFilter, lines);
        });
    };

    /**
     * Loads user rules text from storage
     * @param callback Callback function
     */
    const getUserRulesText = function (callback) {
        rulesStorage.read(USER_FILTER_ID, (rulesText) => {
            const content = (rulesText || []).join('\n');
            if (callback) {
                callback(content);
            }
        });
    };

    return {
        updateUserRulesText,
        getUserRulesText,
    };
})();
