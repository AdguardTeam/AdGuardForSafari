const twoskyConfigs = require('./.twosky.js');

const config = twoskyConfigs[0];

const locales = Object.keys(config.languages);

/**
 * Replace locale pairs according to json_pairs map from twosky.json file
 * @type {string[]}
 */
const electronCompatibleLocales = locales.map((locale) => {
    return config?.json_pairs?.[locale] || locale;
});

module.exports.LOCALES = electronCompatibleLocales;
