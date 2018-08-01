const whitelist = require('./lib/whitelist');
const filters = require('./lib/filters-manager');
const subscriptions = require('./lib/filters/subscriptions');
const log = require('./lib/utils/log');

/**
 * Application
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = () => {
        log.info('Application initialization..');

        subscriptions.init(() => {
            whitelist.init();

            //TODO: Postpone load rules from files and save to storage
            // filters.loadRules((rules) => {
            //     console.log('Loaded rules: ' + rules.length);
            // });
            log.info('Application initialization finished');
        });
    };

    return {
        init: init
    };

})();