const whitelist = require('./lib/whitelist');
const filters = require('./lib/filters-manager');
const subscriptions = require('./lib/filters/subscriptions');

/**
 * Application
 */
module.exports = (() => {

    /**
     * Initialize application services
     */
    const init = () => {
        subscriptions.init(() => {
            whitelist.init();

            //TODO: Postpone load rules from files and save to storage
            // filters.loadRules((rules) => {
            //     console.log('Loaded rules: ' + rules.length);
            // });
        });
    };

    return {
        init: init
    };

})();