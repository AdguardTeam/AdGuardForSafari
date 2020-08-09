const i18n = require('../../utils/i18n');

/**
 * Translate elements on document ready
 */
document.addEventListener('DOMContentLoaded', () => {
    i18n.setAppLocale(navigator.language || navigator.browserLanguage);

    document.querySelectorAll('[i18n]').forEach((el) => {
        const message = i18n.__(`${el.getAttribute('i18n')}.message`);
        I18nHelper.translateElement(el, message);
    });
    document.querySelectorAll('[i18n-plhr]').forEach((el) => {
        const message = i18n.__(`${el.getAttribute('i18n-plhr')}.message`);
        el.setAttribute('placeholder', message);
    });
    document.querySelectorAll('[i18n-href]').forEach((el) => {
        const message = i18n.__(`${el.getAttribute('i18n-href')}.message`);
        el.setAttribute('href', message);
    });
    document.querySelectorAll('[i18n-title]').forEach((el) => {
        const message = i18n.__(`${el.getAttribute('i18n-title')}.message`);
        el.setAttribute('title', message);
    });
});
