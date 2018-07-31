const settings = require('../settings-manager');
const listeners = require('../notifier');
const contentBlockerAdapter = require('./content-blocker-adapter');

module.exports = (() => {

    'use strict';

    // Subscribe to events which lead to content blocker update
    listeners.addListener(event => {

        if (event === listeners.REQUEST_FILTER_UPDATED ||
            event === listeners.UPDATE_WHITELIST_FILTER_RULES) {

            contentBlockerAdapter.updateContentBlocker();
        }
    });

    // // When content blocker is updated we need to save finally converted rules count and over limit flag
    // adguard.listeners.addListener(function (event, info) {
    //     if (event === adguard.listeners.CONTENT_BLOCKER_UPDATED) {
    //         adguard.requestFilter.updateContentBlockerInfo(info);
    //     }
    // });

})();
