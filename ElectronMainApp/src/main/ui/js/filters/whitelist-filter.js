/* global ace */

const { ipcRenderer } = require('electron');
const utils = require('../utils/common-utils');
const editorUtils = require('../utils/editor-utils');
const checkboxUtils = require('../utils/checkbox-utils');

/**
 * Whitelist block
 *
 * @param userSettings
 */
const WhiteListFilter = function (userSettings, contentBlockerInfo) {
    'use strict';

    const editorId = 'whiteListRules';
    const editor = ace.edit(editorId);
    editorUtils.handleEditorResize(editor);

    editor.setShowPrintMargin(false);

    editor.$blockScrolling = Infinity;
    editor.session.setMode('ace/mode/adguard');
    editor.setOption('wrap', true);

    const saveIndicatorElement = document.querySelector('#whiteListRulesSaveIndicator');
    const saver = new editorUtils.Saver({
        editor,
        saveEventType: 'saveWhiteListDomains',
        indicatorElement: saveIndicatorElement,
    });

    const changeDefaultWhiteListModeCheckbox = document.querySelector('#changeDefaultWhiteListMode');
    const whiteListEditor = document.querySelector('#whiteListRules > textarea');
    const applyChangesBtn = document.querySelector('#whiteListFilterApplyChanges');

    let hasContent = false;
    function loadWhiteListDomains() {
        const response = ipcRenderer.sendSync('renderer-to-main', JSON.stringify({
            'type': 'getWhiteListDomains',
        }));
        /* eslint-disable-next-line no-unused-vars */
        hasContent = !!response.content;
        editor.setValue(response.content || '', 1);
        applyChangesBtn.classList.add('disabled');
        const whitelistedNum = editorUtils.countNotEmptyLines(response.content);
        utils.setAllowlistInfo(whitelistedNum);
        contentBlockerInfo.whitelistedNum = whitelistedNum;
    }

    applyChangesBtn.onclick = (event) => {
        event.preventDefault();
        saver.saveData();
        whiteListEditor.focus();
    };

    editor.commands.addCommand({
        name: 'save',
        bindKey: { win: 'Ctrl-S', 'mac': 'Cmd-S' },
        exec: () => saver.saveData(),
    });

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();

        utils.setIsAllowlistInverted(e.currentTarget.checked);
        userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE] = !e.currentTarget.checked;

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'changeDefaultWhiteListMode',
            enabled: !e.currentTarget.checked,
        }));

        loadWhiteListDomains();
    }

    changeDefaultWhiteListModeCheckbox.addEventListener('change', changeDefaultWhiteListMode);

    checkboxUtils.updateCheckbox(
        [changeDefaultWhiteListModeCheckbox],
        !userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE]
    );

    const importAllowlistInput = document.querySelector('#importAllowlistInput');
    const importAllowlistBtn = document.querySelector('#allowlistImport');
    const exportAllowlistBtn = document.querySelector('#allowlistExport');

    const session = editor.getSession();

    session.addEventListener('change', () => {
        applyChangesBtn.classList.remove('disabled');
        if (session.getValue().length > 0) {
            exportAllowlistBtn.classList.remove('disabled');
        } else {
            exportAllowlistBtn.classList.add('disabled');
        }
    });

    importAllowlistBtn.addEventListener('click', (event) => {
        event.preventDefault();
        importAllowlistInput.click();
    });

    importAllowlistInput.addEventListener('change', async (event) => {
        try {
            const importedDomains = await utils.importRulesFromFile(event);
            utils.addRulesToEditor(editor, importedDomains);
            saver.saveData();
        } catch (err) {
            /* eslint-disable-next-line no-console */
            console.error(err.message);
        }
    });

    exportAllowlistBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (exportAllowlistBtn.classList.contains('disabled')) {
            return;
        }

        const fileName = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE]
            ? 'adguard-allowlist'
            : 'adguard-allowlist-inverted';

        utils.exportFile(fileName, 'txt', editor.getValue())
            .catch((err) => {
                /* eslint-disable-next-line no-console */
                console.error(err.message);
            });
    });

    /**
     * returns true if allowlist is empty
     */
    const isAllowlistEmpty = () => {
        return !editor.getValue().trim();
    };

    return {
        updateWhiteListDomains: loadWhiteListDomains,
        isAllowlistEmpty,
    };
};

module.exports = WhiteListFilter;
