const settings = require('../settings-manager');
const listeners = require('../../notifier');
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
        listeners.addListener(event => {

            if (event === listeners.REQUEST_FILTER_UPDATED ||
                event === listeners.UPDATE_WHITELIST_FILTER_RULES) {

                contentBlockerAdapter.updateContentBlocker();
            }
        });

        // When content blocker is updated we need to save finally converted rules count and over limit flag
        listeners.addListener(function (event, info) {
            if (event === listeners.CONTENT_BLOCKER_UPDATED) {
                antibanner.updateContentBlockerInfo(info);
            }
        });
    };

    return {
        init: init
    }

})();
