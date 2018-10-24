/* global I18nHelper */

const i18n = require("i18n");
const appPack = require('../../utils/app-pack');

i18n.configure({
    locales: ['en', 'de', 'ru'],
    directory: appPack.resourcePath('/locales'),
    objectNotation: true
});

/**
 * Translate elements on document ready
 */
document.addEventListener("DOMContentLoaded", () => {
    const defaultLocale = 'en';
    const navigatorLang = navigator.language || navigator.browserLanguage;
    const currentLocale = navigatorLang.substr(0, 2);
    const catalog = i18n.getCatalog(currentLocale)
        ? i18n.getCatalog(currentLocale)
        : i18n.getCatalog(defaultLocale);

    document.querySelectorAll("[i18n]").forEach(el => {
        const key = el.getAttribute("i18n");
        const message = catalog[key] && catalog[key].message;
        I18nHelper.translateElement(el, message);
    });
    document.querySelectorAll("[i18n-plhr]").forEach(el => {
        const key = el.getAttribute("i18n-plhr");
        const message = catalog[key] && catalog[key].message;
        el.setAttribute("placeholder", message);
    });
    document.querySelectorAll("[i18n-href]").forEach(el => {
        const key = el.getAttribute("i18n-href");
        const message = catalog[key] && catalog[key].message;
        el.setAttribute("href", message);
    });
    document.querySelectorAll("[i18n-title]").forEach(el => {
        const key = el.getAttribute("i18n-title");
        const message = catalog[key] && catalog[key].message;
        el.setAttribute("title", message);
    });
});
