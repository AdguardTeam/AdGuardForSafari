/* global i18n */

const path = require('path');
const { ipcRenderer } = require('electron');

const Utils = {

    /**
     * Debounces function with specified timeout
     *
     * @param func
     * @param wait
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            const later = function () {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escapes regular expression
     */
    escapeRegExp: (function () {
        const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
        return function (str) {
            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }
            return str.replace(matchOperatorsRe, '\\$&');
        };
    })(),

    /**
     * Creates HTMLElement from string
     *
     * @param {String} html HTML representing a single element
     * @return {Element}
     */
    htmlToElement(html) {
        const template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    },

    /**
     * Imports rules from file
     * @param event
     */
    importRulesFromFile: function importRulesFromFile(event) {
        return new Promise((resolve) => {
            const fileInput = event.target;
            const reader = new FileReader();
            reader.onload = function (e) {
                fileInput.value = '';
                resolve(e.target.result);
            };
            reader.onerror = function (err) {
                throw new Error(`${i18n.__('options_userfilter_import_rules_error')} ${err.message}`);
            };
            const file = fileInput.files[0];
            if (file) {
                if (file.type !== 'text/plain') {
                    throw new Error(i18n.__('options_popup_import_rules_wrong_file_extension'));
                }
                reader.readAsText(file, 'utf-8');
            }
        });
    },

    /**
     * Adds rules into editor
     * @param editor
     * @param rules
     */
    addRulesToEditor: function addRulesToEditor(editor, rules) {
        const oldRules = editor.getValue();
        const newRules = `${oldRules}\n${rules}`.split('\n');
        const trimmedRules = newRules.map((rule) => rule.trim());
        const ruleSet = new Set(trimmedRules);
        const uniqueRules = Array.from(ruleSet).join('\n');
        editor.setValue(uniqueRules.trim());
    },

    getExtension: function getExtension(filename) {
        if (!filename) {
            return undefined;
        }
        return path.extname(filename).substring(1);
    },

    handleImportSettings(event) {
        const onFileLoaded = (content) => {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'applyUserSettings',
                'settings': content,
            }));
        };

        const file = event.currentTarget.files[0];
        if (file) {
            if (this.getExtension(file.name) !== 'json') {
                throw new Error(i18n.__('options_settings_import_wrong_file_extension'));
            }
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (evt) {
                onFileLoaded(evt.target.result);
            };
            reader.onerror = function () {
                throw new Error(i18n.__('options_settings_import_error'));
            };
        }
    },
};

module.exports = Utils;
