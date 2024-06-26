const { app } = require('electron');
const safariExt = require('safari-ext');
const localStorage = require('./storage/storage');
const packageJson = require('../../../package.json');

/**
 * Application
 */
module.exports = (() => {
    /**
     * Client id
     */
    const getClientId = () => {
        let clientId = localStorage.getItem('client-id');
        if (!clientId) {
            const result = [];
            const suffix = (Date.now()) % 1e8;
            const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
            for (let i = 0; i < 8; i += 1) {
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                result.push(symbol);
            }

            clientId = result.join('') + suffix;
            localStorage.setItem('client-id', clientId);
        }

        return clientId;
    };

    /**
     * @returns {*} Application version from package.json
     */
    const getVersion = () => {
        return app.getVersion();
    };

    /**
     * @returns {*} Application build number
     */
    const getBuildNumber = () => {
        return safariExt.getBuildNumber();
    };

    /**
     * {*|string} Application locale
     */
    const getLocale = () => {
        return app.getLocale();
    };

    /**
     * @returns {*|string} Application ID
     */
    const getId = () => {
        return 'com.adguard.safari.application.dev';
    };

    /**
     * @returns {*|string} Application update channel
     */
    const getChannel = () => {
        const isStandaloneBuild = packageJson['standalone-build'] === 'true';
        const isStandaloneBeta = packageJson['standalone-beta'] === 'true';

        if (isStandaloneBeta) {
            return 'Standalone Beta';
        }

        if (isStandaloneBuild) {
            return 'Standalone Release';
        }

        return 'MAS';
    };

    /**
     * @returns {*|string} Build configuration (Debug, Release, etc)
     */
    const getConfiguration = () => {
        return packageJson['build-configuration'];
    };

    return {
        getVersion,
        getBuildNumber,
        getLocale,
        getId,
        getClientId,
        getChannel,
        getConfiguration,
    };
})();
