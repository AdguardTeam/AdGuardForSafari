const safariToolbar = require('safari-ext');
const { app } = require('electron');
const appApi = require('./app');
const localStorage = require('./storage/storage');
const versionUtils = require('./utils/version');
const settings = require('./settings-manager');
const log = require('./utils/log');
const filtersUpdate = require('./filters/filters-update');
const { removeObsoleteFilters, cleanRemovedCustomFilters } = require('./filters-manager');

/**
 * Service that manages app version information and handles
 * app update. For instance we may need to change storage schema on update.
 */
module.exports = (function () {
    const APP_VERSION_KEY = 'app-version';

    /**
     * @returns Extension version
     */
    const getAppVersion = () => localStorage.getItem(APP_VERSION_KEY);

    /**
     * Saves version
     *
     * @param version
     */
    const setAppVersion = (version) => {
        localStorage.setItem(APP_VERSION_KEY, version);
    };

    /**
     * Async returns extension run info
     *
     * @param callback Run info callback with passed object
     * {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    const getRunInfo = function (callback) {
        const prevVersion = getAppVersion();
        const currentVersion = appApi.getVersion();
        setAppVersion(currentVersion);

        const isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        const isUpdate = !!(currentVersion !== prevVersion && prevVersion);

        /* eslint-disable-next-line max-len */
        const isMajorUpdate = versionUtils.getMajorVersionNumber(currentVersion) > versionUtils.getMajorVersionNumber(prevVersion)
            || versionUtils.getMinorVersionNumber(currentVersion) > versionUtils.getMinorVersionNumber(prevVersion);

        callback({
            isFirstRun,
            isUpdate,
            currentVersion,
            prevVersion,
            isMajorUpdate,
        });
    };

    /**
     * Updates use optimized setting
     */
    const onUpdateUseOptimizedFilters = () => {
        log.info('Execute update optimized filters procedure');

        if (!settings.getProperty('use-optimized-filters')) {
            settings.setProperty('use-optimized-filters', true);

            log.info('Triggering filters reload');
            filtersUpdate.reloadAntiBannerFilters();
        }
    };

    /**
     * Move launch at login to AdGuard Login helper scheme
     */
    const onUpdateLaunchAtLogin = () => {
        settings.changeLaunchAtLogin(settings.isLaunchAtLoginEnabled());

        app.setLoginItemSettings({
            openAtLogin: false,
        });

        // Remove electron login item
        safariToolbar.removeOldLoginItem((result) => {
            log.info(`Login item removed with result: ${result}`);
        });
    };

    /**
     * Handle application update
     *
     * @param runInfo   Run info
     * @param callback  Called after update was handled
     */
    const onUpdate = (runInfo, callback) => {
        log.info(`On update from v${runInfo.prevVersion} to ${runInfo.currentVersion}`);

        if (versionUtils.isGreaterVersion('1.6.0', runInfo.prevVersion)) {
            onUpdateUseOptimizedFilters();
        }

        if (versionUtils.isGreaterVersion('1.6.2', runInfo.prevVersion)) {
            onUpdateLaunchAtLogin();
        }

        removeObsoleteFilters();
        cleanRemovedCustomFilters();
        callback();
    };

    return {
        getRunInfo,
        onUpdate,
    };
})();
