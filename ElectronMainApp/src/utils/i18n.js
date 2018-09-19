const i18n = require("i18n");
const appPack = require('./app-pack');

module.exports = (() => {

    i18n.configure({
        locales: ['en', 'de'],
        directory: appPack.resourcePath('/locales'),
        objectNotation: true
    });

    return i18n;

})();
