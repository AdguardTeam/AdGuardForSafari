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
        objectNotation: true
    });

    return i18n;

})();
