const safariExt = require('safari-ext');
const log = require('./app/utils/log');

/**
 * Launch state, used to determine if the app should be launched in background
 */
class LaunchState {
    constructor() {
        this.launchInBackgroundState = null;
    }

    /**
     * Returns true if the app was launched at background
     * @returns {Promise<boolean | null>}
     */
    async launchedBackground() {
        if (this.launchInBackgroundState === null) {
            try {
                this.launchInBackgroundState = await safariExt.getLaunchedBackground();
            } catch (e) {
                log.error(e.message);
                this.launchInBackgroundState = null;
            }
            log.info(`Launched at background: ${this.launchInBackgroundState}`);
        }
        return this.launchInBackgroundState;
    }
}

const launchState = new LaunchState();

module.exports = { launchState };
