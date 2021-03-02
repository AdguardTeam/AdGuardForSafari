const listeners = require('../../notifier');
const events = require('../../events');
const contentBlockerAdapter = require('./content-blocker-adapter');
const antibanner = require('../antibanner');

/**
 * Content Blocker Listener
 *
 * @type {{init}}
 */
module.exports = (() => {
    'use strict';

    /**
     * Sets up listener for content blocker events
     */
    const init = () => {
        // Subscribe to events which lead to content blocker update
        listeners.addListener((event) => {
            if (event === events.REQUEST_FILTER_UPDATED
                || event === events.UPDATE_WHITELIST_FILTER_RULES
                || event === events.UPDATE_USER_FILTER_RULES) {
                contentBlockerAdapter.updateContentBlocker();
            }
        });

        // When content blocker is updated we need to save finally converted rules count and over limit flag
        listeners.addListener((event, info) => {
            if (event === events.CONTENT_BLOCKER_UPDATED) {
                antibanner.updateContentBlockerInfo(info);
            }
        });
    };

    return {
        init,
    };
})();
