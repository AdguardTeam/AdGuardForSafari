// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { insertNewline } from '@codemirror/commands';
import { closeSearchPanel, openSearchPanel, searchKeymap } from '@codemirror/search';
import { EditorState, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

import { enterLineNumber, isCommentLine, setEnterLine, toggleBreakpoint } from './breakpoints';
import { copyRuleLines, deleteRuleLines, moveRuleLines } from './lineCommands';

import type { Extension, TransactionSpec } from '@codemirror/state';
import type { Command, EditorView } from '@codemirror/view';

/**
 * Runs a line command expressed as a transaction spec and reports whether it
 * had anything to do, so an impossible move can fall through to other
 * bindings.
 *
 * @param build Builds the spec from the current editor state.
 * @returns The CodeMirror command.
 */
function runLineCommand(build: (state: EditorState) => TransactionSpec | null): Command {
    return (view) => {
        const spec = build(view.state);
        if (!spec) {
            return false;
        }
        view.dispatch(spec);
        return true;
    };
}

/**
 * Inserts a newline with the default `Enter` behavior and records the line
 * the break created as pending, so the line is enabled automatically once it
 * gains non-comment content (v1 semantics).
 *
 * @param view The editor view.
 * @returns True when the newline was inserted.
 */
export function insertEnterLine(view: EditorView): boolean {
    // `Enter` at the start of a line inserts the break at the caret and
    // leaves the caret on the line that follows the created one.
    const { main } = view.state.selection;
    const atLineStart = main.empty && main.head === view.state.doc.lineAt(main.head).from;
    if (!insertNewline(view)) {
        return false;
    }
    // The created line is read from the post-insert state: mid-line `Enter`
    // puts the caret on the line the break created, while `Enter` at the
    // start of a line creates the empty line above the caret and must not
    // enable the existing rule below it.
    view.dispatch({ effects: setEnterLine.of(enterLineNumber(view.state, atLineStart)) });
    return true;
}

/**
 * Toggles the enabled marker of the line the caret is on (v1 semantics).
 * Comment lines cannot be enabled, so the key is consumed without a toggle
 * there.
 *
 * @param view The editor view.
 * @param onToggle Invoked after the marker was toggled.
 * @returns True when the key was handled.
 */
export function toggleMarkerLine(view: EditorView, onToggle?: () => void): boolean {
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    if (!isCommentLine(line.text)) {
        view.dispatch({ effects: toggleBreakpoint.of(line.from) });
        onToggle?.();
    }
    return true;
}

/**
 * Stops the rules-editor's `Mod-h` binding from reaching the editor: it
 * would shadow the app's Hide menu item (`Cmd-H`). The event is not
 * `preventDefault`ed, so WebKit still hands the unhandled shortcut to the
 * app menu.
 *
 * @param event The keydown event.
 */
export function keepHideShortcut(event: KeyboardEvent): void {
    if (event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'h') {
        event.stopPropagation();
    }
}

/**
 * Localized strings for CodeMirror's own UI — the search panel and the
 * screen-reader announcements that report a replacement — keyed by the
 * English phrase the editor looks up. Resolved when the editor initializes:
 * the module language arrives over RPC, and the editor is created (and
 * re-created on a language change) after it does.
 *
 * @returns The phrase map for `EditorState.phrases`.
 */
export function searchPhrases(): { [phrase: string]: string } {
    return {
        'Find': translate('user.rules.editor.search.find'),
        'Replace': translate('user.rules.editor.search.replace'),
        'next': translate('user.rules.editor.search.next'),
        'previous': translate('user.rules.editor.search.previous'),
        'all': translate('user.rules.editor.search.all'),
        'match case': translate('user.rules.editor.search.match_case'),
        'regexp': translate('user.rules.editor.search.regexp'),
        'by word': translate('user.rules.editor.search.whole_word'),
        'replace': translate('user.rules.editor.search.replace'),
        'replace all': translate('user.rules.editor.search.replace_all'),
        'close': translate('close'),
        // `$` is CodeMirror's placeholder for the match count and the line
        // number; it must survive in the translated string.
        'replaced $ matches': translate('user.rules.editor.search.replaced_matches'),
        'replaced match on line $': translate('user.rules.editor.search.replaced_match_on_line'),
        // Announced to screen readers on every match navigation.
        'current match': translate('user.rules.editor.search.current_match'),
        'on line': translate('user.rules.editor.search.on_line'),
        // The go-to-line dialog (`Mod-Alt-g`) shares the panel's phrases.
        'Go to line': translate('user.rules.editor.search.go_to_line'),
        'go': translate('user.rules.editor.search.go'),
    };
}

/**
 * The editor extensions that restore the v1 editing behaviors the
 * rules-editor v2 dropped and wire the search panel: the `Enter` auto-enable
 * and `Mod-/` marker toggle, the localized search phrases and keymap, and
 * the marker-aware line commands.
 *
 * @param options Marker toggle callback, invoked after a marker was toggled.
 * @returns The extensions to add to the editor.
 */
export function editorExtensions(options: { onToggle(): void }): Extension[] {
    return [
        // A new line created with `Enter` becomes enabled automatically once
        // it gains content (v1 semantics). The default binding only inserts
        // the newline, so record the line to enable in the handler and let
        // `insertNewline` keep the default behavior.
        Prec.high(keymap.of([{ key: 'Enter', run: insertEnterLine }])),
        // `Mod-/` toggles the enabled marker of the current line (v1
        // semantics). The rules-editor binds the same key to marker toggle +
        // comment insertion; this higher-precedence binding shadows it.
        Prec.high(keymap.of([{ key: 'Mod-/', run: (view) => toggleMarkerLine(view, options.onToggle) }])),
        // CodeMirror ships the search panel with English strings; register
        // the localized ones.
        EditorState.phrases.of(searchPhrases()),
        // The rules-editor installs the search extension but not its keymap,
        // so the panel could not be opened or closed from the keyboard.
        // Install the standard keymap and add `Cmd-R`, the legacy editor's
        // find-and-replace shortcut, which opens the same panel whose replace
        // field the hotkey list advertises.
        keymap.of(searchKeymap),
        Prec.high(keymap.of([
            { key: 'Mod-r', run: openSearchPanel },
            // `Escape` closes the panel before the default keymap can
            // collapse a document selection instead (`simplifySelection`
            // reports success for any non-empty selection).
            { key: 'Escape', run: closeSearchPanel, scope: 'editor search-panel' },
        ])),
        // The line commands carry the enabled marker with the rule they
        // move, copy or delete; the library's own bindings only rearrange
        // the text, which left the marker on the line number instead of the
        // rule.
        Prec.high(keymap.of([
            { key: 'Alt-ArrowUp', run: runLineCommand((state) => moveRuleLines(state, false)) },
            { key: 'Alt-ArrowDown', run: runLineCommand((state) => moveRuleLines(state, true)) },
            { key: 'Shift-Alt-ArrowUp', run: runLineCommand((state) => copyRuleLines(state, false)) },
            { key: 'Shift-Alt-ArrowDown', run: runLineCommand((state) => copyRuleLines(state, true)) },
            { key: 'Mod-d', run: runLineCommand(deleteRuleLines) },
        ])),
    ];
}
