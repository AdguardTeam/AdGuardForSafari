const { dialog } = require('electron');
const updater = require('electron-simple-updater');
const config = require('config');
const safariExt = require('safari-ext');

const packageJson = require('../../package.json');
const i18n = require('../utils/i18n');
const log = require('./app/utils/log');
const listeners = require('./notifier');
const events = require('./events');
const storage = require('./app/storage/storage');

/**
 * Updater
 */
module.exports = (() => {
    // Storage key for 'Do not show again' preference
    const HIDE_UPDATE_NOT_ALLOWED_DIALOG = 'hide-update-not-allowed-dialog';

    /**
     * Initialize
     */
    const initUpdater = () => {
        if (!isUpdatePermitted()) {
            return;
        }

        updater.init({
            channel: packageJson['standalone-beta'] === 'true' ? 'beta' : 'prod',
            url: config.get('updatesUrl'),
        });

        updater.on('checking-for-update', () => {
            log.info('Checking for updates..');
        });

        updater.on('error', (error) => {
            log.error(`Checking for updates failed: ${error}`);
            listeners.notifyListeners(events.APPLICATION_UPDATE_ERROR);
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
     * if macOS version is supported,
     * otherwise notifies about not allowed update.
     */
    const checkForUpdates = () => {
        const osVersion = safariExt.getOSVersion();

        if (!isUpdateAllowedForMacOs(osVersion)) {
            listeners.notifyListeners(events.APPLICATION_UPDATE_NOT_ALLOWED);

            // Check if user has chosen to hide this dialog
            const hideDialog = storage.getItem(HIDE_UPDATE_NOT_ALLOWED_DIALOG);
            if (hideDialog) {
                log.info('Dialog "Update not allowed" hidden by user');
                return;
            }

            dialog.showMessageBox({
                type: 'warning',
                message: i18n.__('options_about_update_not_allowed_title.message'),
                detail: i18n.__('options_about_update_not_allowed_details.message'),
                checkboxLabel: i18n.__('options_about_update_not_allowed_checkbox.message'),
                checkboxChecked: false,
                buttons: [
                    i18n.__('options_about_update_not_allowed_btn_ok.message'),
                ],
                defaultId: 0,
                cancelId: 0,
            }).then(({ checkboxChecked }) => {
                if (checkboxChecked) {
                    storage.setItem(HIDE_UPDATE_NOT_ALLOWED_DIALOG, true);
                    log.info('User chose to hide dialog "Update not allowed"');
                }
            });

            return;
        }

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
        return packageJson['standalone-build'] === 'true';
    };

    /**
     * Checks if updates are allowed for macOS.
     *
     * @param {number} osVersion Version of macOS.
     *
     * @returns {boolean} True if macOS version is 12.0 or higher, false otherwise.
     */
    const isUpdateAllowedForMacOs = (osVersion) => {
        return osVersion >= 12;
    };

    return {
        initUpdater,
        checkForUpdates,
        isUpdatePermitted,
        quitAndInstall,
    };
})();
