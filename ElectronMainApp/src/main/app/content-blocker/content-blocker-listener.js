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

    let processing = false;
    let dirty = false;

    /**
     * Reloads content blockers
     *
     * This implementation waits for previous call to complete, cause otherwise we have a race condition with content
     * blockers loading to safari. We skip repeated calls here as well.
     *
     * https://jira.adguard.com/browse/AG-7168
     */
    const reloadContentBlockers = () => {
        if (processing) {
            dirty = true;
            return;
        }

        processing = true;
        dirty = false;

        contentBlockerAdapter.updateContentBlocker(() => {
            if (dirty) {
                // Needs reload after timeout
                setTimeout(() => {
                    processing = false;
                    reloadContentBlockers();
                }, 5000);
            } else {
                processing = false;
            }
        });
    };

    /**
     * Sets up listener for content blocker events
     */
    const init = () => {
        // Subscribe to events which lead to content blocker update
        listeners.addListener((event) => {
            if (event === events.REQUEST_FILTER_UPDATED
                || event === events.UPDATE_WHITELIST_FILTER_RULES) {
                reloadContentBlockers();
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
