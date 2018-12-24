const i18n = require("i18n");
const appPack = require('./app-pack');
const { LOCALES } = require('../../locales/locales');

/**
 * Configures i18n
 */
module.exports = (() => {

    i18n.configure({
        locales: LOCALES,
        directory: appPack.resourcePath('/locales'),
        objectNotation: true,
        updateFiles: false,
    });

    i18n.setAppLocale = function (appLocale) {
        const appLanguage = appLocale.substr(0, 2);
        let resultLocale = 'en';

        // Looking for locale match
        const fullMatch = Object.keys(i18n.getCatalog())
            .some(key => {
                const match = key.replace(/-/g, '_').toLowerCase() === appLocale.replace(/-/g, '_').toLowerCase();
                if (match) {
                    resultLocale = key;
                }
                return match;
            });

        // Looking for language match
        if (!fullMatch) {
            Object.keys(i18n.getCatalog())
                .some(key => {
                    const match = key.toLowerCase() === appLanguage.toLowerCase();
                    if (match) {
                        resultLocale = key;
                    }
                    return match;
                });
        }

        i18n.setLocale(resultLocale);
    }

    return i18n;

})();
