const updater = require('electron-simple-updater');
const config = require('config');
const packageJson = require('../../package.json');
const log = require('./app/utils/log');
const listeners = require('./notifier');
const events = require('./events');

/**
 * Updater
 */
module.exports = (() => {

    /**
     * Initialize
     */
    const initUpdater = () => {
        if (!isUpdatePermitted()) {
            return;
        }

        updater.init({
            channel: packageJson["standalone-beta"] === 'true' ? 'beta' : 'prod',
            url: config.get('updatesUrl')
        });

        updater.on('checking-for-update', () => {
            log.info('Checking for updates..');
        });

        updater.on('update-available', (meta) => {
            log.info(`Update found version ${meta.version} at ${meta.update}`);
            listeners.notifyListeners(events.APPLICATION_UPDATE_FOUND, meta);
        });

        updater.on('update-not-available', () => {
            log.info('Updates not found');
            listeners.notifyListeners(events.APPLICATION_UPDATE_NOT_FOUND);
        });

        updater.on('update-downloaded', () => {
            log.info('Update downloaded');
            listeners.notifyListeners(events.APPLICATION_UPDATE_DOWNLOADED);
        });
    };

    /**
     * Checks for updates with result notifications
     */
    const checkForUpdates = () => {
        updater.checkForUpdates();
    };

    /**
     * Relaunch and install updates
     */
    const quitAndInstall = () => {
        updater.quitAndInstall();
    };

    /**
     * Checks if updates are permitted
     *
     * @return {boolean}
     */
    const isUpdatePermitted = () => {
        return packageJson["standalone-build"] === 'true';
    };

    return {
        initUpdater,
        checkForUpdates,
        isUpdatePermitted,
        quitAndInstall,
    }
})();



