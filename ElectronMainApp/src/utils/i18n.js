const i18n = require("i18n");
const appPack = require('./app-pack');

/**
 * Configures i18n
 */
module.exports = (() => {

    i18n.configure({
        locales: ['en', 'de', 'ru'],
        directory: appPack.resourcePath('/locales'),
        objectNotation: true
    });

    return i18n;

})();
