/* global I18nHelper */

const i18n = require("i18n");
const appPack = require('../../utils/app-pack');

i18n.configure({
    locales: ['en', 'de'],
    directory: appPack.resourcePath('/locales'),
    objectNotation: true
});

/**
 * Translate elements on document ready
 */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[i18n]").forEach(el => {
        const message = i18n.__(el.getAttribute("i18n") + '.message');
        I18nHelper.translateElement(el, message);
    });
    document.querySelectorAll("[i18n-plhr]").forEach(el => {
        el.setAttribute("placeholder", i18n.__(el.getAttribute("i18n-plhr") + '.message'));
    });
    document.querySelectorAll("[i18n-href]").forEach(el => {
        el.setAttribute("href", i18n.__(el.getAttribute("i18n-href") + '.message'));
    });
    document.querySelectorAll("[i18n-title]").forEach(el => {
        el.setAttribute("title", i18n.__(el.getAttribute("i18n-title") + '.message'));
    });
});
