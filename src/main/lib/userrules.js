const listeners = require('../notifier');
const filters = require('./filters-manager');
const rulesStorage = require('./utils/rules-storage');

/**
 * Class for manage user rules
 */
module.exports = (function () {

    'use strict';

    const USER_FILTER_ID = 0;

    /**
     * Save user rules text to storage
     * @param content Rules text
     * @param options
     */
    const updateUserRulesText = function (content, options) {
        const lines = content.split(/[\r\n]+/) || [];
        //listeners.notifyListeners(listeners.UPDATE_FILTER_RULES, userFilter, lines);
        rulesStorage.write(USER_FILTER_ID, lines, function () {
            listeners.notifyListeners(listeners.UPDATE_USER_FILTER_RULES, filters.getRequestFilterInfo());
            //listeners.notifyListeners(listeners.SYNC_REQUIRED, options);
        });
    };

    /**
     * Loads user rules text from storage
     * @param callback Callback function
     */
    const getUserRulesText = function (callback) {
        rulesStorage.read(USER_FILTER_ID, function (rulesText) {
            const content = (rulesText || []).join('\n');
            callback(content);
        });
    };

    return {
        updateUserRulesText: updateUserRulesText,
        getUserRulesText: getUserRulesText,
    };

})();