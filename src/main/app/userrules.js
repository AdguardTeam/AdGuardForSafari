const config = require('config');
const listeners = require('../notifier');
const events = require('../events');
const antibanner = require('./antibanner');
const rulesStorage = require('./storage/rules-storage');

/**
 * Class for manage user rules
 */
module.exports = (function () {

    'use strict';

    const USER_FILTER_ID = config.get('AntiBannerFiltersId').USER_FILTER_ID;

    /**
     * Save user rules text to storage
     * @param content Rules text
     * @param options
     */
    const updateUserRulesText = function (content, options) {
        const lines = content.split(/[\r\n]+/) || [];
        //listeners.notifyListeners(listeners.UPDATE_FILTER_RULES, userFilter, lines);
        rulesStorage.write(USER_FILTER_ID, lines, function () {
            listeners.notifyListeners(events.UPDATE_USER_FILTER_RULES);
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