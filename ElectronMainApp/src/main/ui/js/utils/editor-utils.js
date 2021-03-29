/* global i18n */

const { ipcRenderer } = require('electron');
const utils = require('./common-utils');

/**
 * Function changes editor size while user resizes editor parent node
 * @param editor
 */
const handleEditorResize = (editor) => {
    const editorId = editor.container.id;
    const DRAG_TIMEOUT_MS = 100;
    const editorParent = editor.container.parentNode;

    const saveSize = (editorParent) => {
        const { width, height } = editorParent.style;
        if (width && height) {
            localStorage.setItem(editorId, JSON.stringify({ size: { width, height } }));
        }
    };

    const restoreSize = (editorParent) => {
        const dataJson = localStorage.getItem(editorId);
        if (!dataJson) {
            return;
        }
        const { size } = JSON.parse(dataJson);
        const { width, height } = size || {};
        if (width && height) {
            editorParent.style.width = width;
            editorParent.style.height = height;
        }
    };

    // restore size is it was set previously set;
    restoreSize(editorParent);

    const onMouseMove = utils.debounce(() => {
        editor.resize();
    }, DRAG_TIMEOUT_MS);

    const onMouseUp = () => {
        saveSize(editorParent);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    editorParent.addEventListener('mousedown', (e) => {
        if (e.target === e.currentTarget) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });
};

const Saver = function (options) {
    const HIDE_INDICATOR_TIMEOUT_MS = 2000;
    const DEBOUNCE_TIME = 1000;

    this.indicatorElement = options.indicatorElement;
    this.editor = options.editor;
    this.saveEventType = options.saveEventType;

    const states = {
        SAVING: 'saving',
        SAVED: 'saved',
    };

    const indicatorText = {
        [states.SAVING]: i18n.__('options_editor_indicator_saving.message'),
        [states.SAVED]: i18n.__('options_editor_indicator_saved.message'),
    };

    const setState = (state) => {
        switch (state) {
            case states.SAVING:
                this.indicatorElement.textContent = indicatorText[states.SAVING];
                this.indicatorElement.classList.remove('filter-rules__label--saved');
                break;
            case states.SAVED:
                this.indicatorElement.textContent = indicatorText[states.SAVED];
                this.indicatorElement.classList.add('filter-rules__label--saved');
                setTimeout(() => {
                    this.indicatorElement.textContent = '';
                    this.indicatorElement.classList.remove('filter-rules__label--saved');
                }, HIDE_INDICATOR_TIMEOUT_MS);
                break;
            default:
                break;
        }
    };

    this.saveData = utils.debounce(() => {
        const text = this.editor.getValue();
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: this.saveEventType,
            content: text,
        }));
        setState(states.SAVED);
    }, DEBOUNCE_TIME);

    const saveData = () => {
        setState(states.SAVING);
        this.saveData();
    };

    return {
        saveData,
    };
};

/**
 * Counts the number of rules excluding empty lines and comments
 * @param text
 * @return {number}
 */
const countRules = (text) => text
    .split('\n')
    .filter((line) => !!line && !line.startsWith('!'))
    .length;

module.exports = {
    handleEditorResize,
    Saver,
    countRules,
};
