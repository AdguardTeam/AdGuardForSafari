const whitelist = require('./app/whitelist');
const antibanner = require('./app/antibanner');
const log = require('./app/utils/log');
const contentBlockerAdapter = require('./app/content-blocker/content-blocker-adapter');

/**
 * Api
 */
module.exports = (() => {

    /**
     * Sets content blocker json
     *
     * @param json
     */
    const setContentBlocker = (json) => {
        contentBlockerAdapter.setSafariContentBlocker(json);
    };

    /**
     * Returns toolbar data for url
     *
     * @param url
     */
    const getToolbarMenuOpened = (url) => {
        const urlFilteringDisabled = !url || url.indexOf('http') !== 0;
        const applicationFilteringDisabled = antibanner.isRunning();
        let isWhitelisted = false;

        if (!urlFilteringDisabled) {
            isWhitelisted = whitelist.isWhitelisted(url);
        }

        return {
            applicationFilteringDisabled: applicationFilteringDisabled,
            urlFilteringDisabled: urlFilteringDisabled,

            isWhitelisted: isWhitelisted
        }
    };

    /**
     * Enables protection for url
     *
     * @param url
     */
    const enable = (url) => {
        whitelist.unWhiteListUrl(url);

        log.info(`Url removed from whitelist: ${url}`);
    };

    /**
     * Disables protection for url
     *
     * @param url
     */
    const disable = (url) => {
        whitelist.whiteListUrl(url);

        log.info(`Url added to whitelist: ${url}`);
    };

    /**
     * Pauses protection
     */
    const pause = () => {
        antibanner.stop();

        log.info('Protection paused');
    };

    /**
     * Starts protection
     */
    const start = () => {
        antibanner.start({}, () => {
            log.info('Protection started');
        });
    };

    return {
        setContentBlocker: setContentBlocker,
        getToolbarMenuOpened: getToolbarMenuOpened,
        enable: enable,
        disable: disable,
        pause: pause,
        start: start
    };

})();