/* global ace */

const { ipcRenderer } = require('electron');
const utils = require('../utils/common-utils');
const editorUtils = require('../utils/editor-utils');
// eslint-disable-next-line import/no-unresolved
const { Range } = require('../libs/ace/ace');

const COMMENT_MASK = '!';

/**
 * User filter block
 */
const UserFilter = function () {
    'use strict';

    const editorId = 'userRules';
    const editor = ace.edit(editorId);
    editorUtils.handleEditorResize(editor);

    editor.setShowPrintMargin(false);

    editor.session.setMode('ace/mode/adguard');
    editor.setOption('wrap', true);

    const userRulesEditor = document.querySelector('#userRules > textarea');
    const applyChangesBtn = document.querySelector('#userFilterApplyChanges');
    const saveIndicatorElement = document.querySelector('#userRulesSaveIndicator');

    const saver = new editorUtils.Saver({
        editor,
        saveEventType: 'saveUserRules',
        indicatorElement: saveIndicatorElement,
    });

    let hasContent = false;
    function loadUserRules(contentBlockerInfo) {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'getUserRules',
        }));

        ipcRenderer.on('getUserRulesResponse', (e, arg) => {
            /* eslint-disable-next-line no-unused-vars */
            hasContent = !!arg.content;
            const userRulesText = (arg.content || []).join('\n');
            editor.setValue(userRulesText, 1);
            applyChangesBtn.classList.add('disabled');
            const userrulesNum = editorUtils.countRules(userRulesText);
            utils.setUserrulesNum(userrulesNum);
            contentBlockerInfo.userRulesNum = userrulesNum;
        });
    }

    applyChangesBtn.onclick = (event) => {
        event.preventDefault();
        saver.saveData();
        userRulesEditor.focus();
    };

    editor.commands.addCommand({
        name: 'save',
        bindKey: { win: 'Ctrl-S', 'mac': 'Cmd-S' },
        exec: () => saver.saveData(),
    });

    editor.commands.addCommand({
        name: 'comment',
        bindKey: { win: 'Ctrl-/', 'mac': 'Cmd-/' },
        exec: (editor) => {
            const selection = editor.getSelection();
            const ranges = selection.getAllRanges();

            const selectedRows = ranges
                .map((range) => {
                    const [start, end] = [range.start.row, range.end.row];
                    return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
                })
                .flat();

            // check if all selected lines are commented
            const hasUncommentedRows = selectedRows.some((row) => !editor.session
                .getLine(row)
                .trim()
                .startsWith(COMMENT_MASK));

            selectedRows.forEach((row) => {
                if (hasUncommentedRows) {
                    // add comment mark
                    editor.session.insert({ row, column: 0 }, `${COMMENT_MASK} `);
                } else {
                    // remove comment mark
                    const rawLine = editor.session.getLine(row);
                    const newLine = rawLine.replace(`${COMMENT_MASK} `, '').trim();
                    editor.session.replace(new Range(row, 0, row), newLine);
                }
            });
        },
    });

    /**
     * returns true is user filter is empty
     */
    const isUserFilterEmpty = () => {
        return !editor.getValue().trim();
    };

    const importUserFiltersInput = document.querySelector('#importUserFilterInput');
    const importUserFiltersBtn = document.querySelector('#userFiltersImport');
    const exportUserFiltersBtn = document.querySelector('#userFiltersExport');

    const session = editor.getSession();

    session.addEventListener('change', () => {
        applyChangesBtn.classList.remove('disabled');
        if (session.getValue().length > 0) {
            exportUserFiltersBtn.classList.remove('disabled');
        } else {
            exportUserFiltersBtn.classList.add('disabled');
        }
    });

    importUserFiltersBtn.addEventListener('click', (event) => {
        event.preventDefault();
        importUserFiltersInput.click();
    });

    importUserFiltersInput.addEventListener('change', async (event) => {
        try {
            const importedRules = await utils.importRulesFromFile(event);
            utils.addRulesToEditor(editor, importedRules);
            saver.saveData();
        } catch (err) {
            /* eslint-disable-next-line no-console */
            console.error(err.message);
        }
    });

    exportUserFiltersBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (exportUserFiltersBtn.classList.contains('disabled')) {
            return;
        }
        utils.exportFile('adguard-user-rules', 'txt', editor.getValue())
            .catch((err) => {
                /* eslint-disable-next-line no-console */
                console.error(err.message);
            });
    });

    return {
        updateUserFilterRules: loadUserRules,
        isUserFilterEmpty,
    };
};

module.exports = UserFilter;
