const twoskyConfigs = require('./.twosky.js');

const config = twoskyConfigs[0];

const locales = Object.keys(config.languages);

module.exports.LOCALES = locales;
