/* global I18nHelper */

const i18n = require("i18n");
const appPack = require('../../utils/app-pack');
const { LOCALES } = require('../../../locales/locales');

i18n.configure({
    locales: LOCALES,
    directory: appPack.resourcePath('/locales'),
    objectNotation: true
});

/**
 * Translate elements on document ready
 */
document.addEventListener("DOMContentLoaded", () => {
    const defaultLocale = 'en';
    const navigatorLocale = navigator.language || navigator.browserLanguage;
    const navigatorLanguage = navigatorLocale.substr(0, 2);
    let catalog = i18n.getCatalog(defaultLocale);

    // Looking for locale match
    const fullMatch = Object.keys(i18n.getCatalog())
        .some(locale => {
            const match = locale.replace(/-/g, '_').toLowerCase() === navigatorLocale.replace(/-/g, '_').toLowerCase();
            if (match) {
                catalog = i18n.getCatalog(locale);
            }
            return match;
        });

    // Looking for language match
    if (!fullMatch) {
        Object.keys(i18n.getCatalog())
            .some(locale => {
                const match = locale.toLowerCase() === navigatorLanguage.toLowerCase();
                if (match) {
                    catalog = i18n.getCatalog(locale);
                }
                return match;
            });
    }

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
