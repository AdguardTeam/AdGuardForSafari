const listeners = require('../../notifier');
const events = require('../../events');
const log = require('../utils/log');

/**
 * Queue of content blockers to process
 */
module.exports = (function () {
    /**
     * Queue
     */
    const contentBlockersQueue = [];

    /**
     * Starts processing data
     *
     * @param data
     */
    const processData = (data) => {
        log.info(`Content blocker processing: ${data.bundleId}`);

        listeners.notifyListeners(events.CONTENT_BLOCKER_UPDATE_REQUIRED, data);
    };

    /**
     * Adds data to process
     *
     * @param data
     */
    const pushContentBlocker = (data) => {
        log.info(`Content blocker queued: ${data.bundleId}`);

        contentBlockersQueue.push(data);

        if (contentBlockersQueue.length === 1) {
            processData(data);
        }
    };

    /**
     * Processes next in queue
     */
    const processNextContentBlocker = () => {
        if (contentBlockersQueue.length > 0) {
            const processed = contentBlockersQueue.shift();
            log.info(`Content blocker processed: ${processed.bundleId}`);
        }

        if (contentBlockersQueue.length > 0) {
            processData(contentBlockersQueue[0]);
        }
    };

    return {
        pushContentBlocker,
        processNextContentBlocker,
    };
})();
