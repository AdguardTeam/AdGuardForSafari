const app = require('./app');
const localStorage = require('./storage/storage');
const versionUtils = require('./utils/version');

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
    const setAppVersion = version =>{
        localStorage.setItem(APP_VERSION_KEY, version);
    };

    /**
     * Async returns extension run info
     *
     * @param callback Run info callback with passed object {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    const getRunInfo = function (callback) {

        const prevVersion = getAppVersion();
        const currentVersion = app.getVersion();
        setAppVersion(currentVersion);

        const isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        const isUpdate = !!(currentVersion !== prevVersion && prevVersion);

        const isMajorUpdate = versionUtils.getMajorVersionNumber(currentVersion) > versionUtils.getMajorVersionNumber(prevVersion) ||
            versionUtils.getMinorVersionNumber(currentVersion) > versionUtils.getMinorVersionNumber(prevVersion);

        callback({
            isFirstRun: isFirstRun,
            isUpdate: isUpdate,
            currentVersion: currentVersion,
            prevVersion: prevVersion,
            isMajorUpdate: isMajorUpdate
        });
    };

    /**
     * Handle application update
     *
     * @param runInfo   Run info
     * @param callback  Called after update was handled
     */
    const onUpdate = (runInfo, callback) =>{
        callback();
    };

    return {
        getRunInfo: getRunInfo,
        onUpdate: onUpdate
    };

})();



