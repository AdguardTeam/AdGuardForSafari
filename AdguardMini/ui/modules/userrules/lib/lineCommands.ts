// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { isolateHistory } from '@codemirror/commands';

import { enabledRuleLines, permuteBreakpoints, replaceBreakpoints } from './breakpoints';

import type { EditorState, TransactionSpec } from '@codemirror/state';

/**
 * A run of whole lines covered by the main selection, described both by
 * offsets and by 1-based line numbers.
 */
type LineBlock = {
    /** Offset of the first line's start. */
    from: number;
    /** Offset of the last line's end. */
    to: number;
    /** 1-based number of the first line. */
    first: number;
    /** 1-based number of the last line. */
    last: number;
};

/**
 * Returns the block of whole lines covered by the main selection. A
 * selection that ends exactly at a line start does not include that line.
 *
 * @param state The editor state.
 * @returns The selected line block.
 */
function selectedLineBlock(state: EditorState): LineBlock {
    const range = state.selection.main;
    const start = state.doc.lineAt(range.from);
    let end = state.doc.lineAt(range.to);
    if (!range.empty && range.to === end.from) {
        end = state.doc.lineAt(range.to - 1);
    }
    return { from: start.from, to: end.to, first: start.number, last: end.number };
}

/**
 * Maps the enabled rule lines across a move of the selected block.
 *
 * The block and its neighbor swap places, so their enabled flags swap with
 * them: the flags stay attached to the rules the user enabled, not to the
 * line numbers they happened to occupy.
 *
 * @param lines Enabled line numbers before the move.
 * @param block The moved block.
 * @param forward Whether the block moves one line down.
 * @returns The enabled line numbers after the move.
 */
function movedLines(lines: number[], block: { first: number; last: number }, forward: boolean): number[] {
    const neighbor = forward ? block.last + 1 : block.first - 1;
    return lines.map((line) => {
        if (line >= block.first && line <= block.last) {
            return line + (forward ? 1 : -1);
        }
        if (line === neighbor) {
            return forward ? block.first : block.last;
        }
        return line;
    });
}

/**
 * Maps the enabled rule lines across a duplication of the selected block.
 *
 * A copy of an enabled rule is an enabled rule, so the duplicate carries the
 * same flags as its source and the source keeps its own. Every line the copy
 * pushes down shifts with it — the flags of the lines below the insertion
 * point must move, or the previously created copies lose their state.
 *
 * @param lines Enabled line numbers before the duplication.
 * @param block The duplicated block.
 * @param forward Whether the copy is inserted below the block.
 * @returns The enabled line numbers after the duplication.
 */
function copiedLines(lines: number[], block: LineBlock, forward: boolean): number[] {
    const length = block.last - block.first + 1;
    const blockFlags = lines.filter((line) => line >= block.first && line <= block.last);
    return forward
        // The copy follows the block: the block keeps its flags and the lines
        // below the insertion point shift down.
        ? [
            ...lines.map((line) => (line > block.last ? line + length : line)),
            ...blockFlags.map((line) => line - block.first + block.last + 1),
        ]
        // The copy takes the block's place: the block and the lines below it
        // shift down and keep their flags.
        : [...lines.map((line) => (line >= block.first ? line + length : line)), ...blockFlags];
}

/**
 * Builds the transaction that moves the selected rule lines one line up or
 * down, carrying the enabled markers with the rules.
 *
 * The change sets mirror `@codemirror/commands`' line commands so the text
 * behaves exactly as before; only the markers are handled explicitly, since
 * a positional mapping cannot tell a swapped line from a deleted one. The
 * markers are permuted rather than replaced, so history can replay the
 * reverse permutation on undo and keep flags toggled after the move.
 *
 * @param state The editor state.
 * @param forward Whether to move the lines one line down.
 * @returns The transaction spec, or `null` when there is nothing to move.
 */
export function moveRuleLines(state: EditorState, forward: boolean): TransactionSpec | null {
    if (state.readOnly) {
        return null;
    }
    const block = selectedLineBlock(state);
    if (forward ? block.last === state.doc.lines : block.first === 1) {
        return null;
    }
    const neighbor = state.doc.line(forward ? block.last + 1 : block.first - 1);
    const changes = forward
        ? [
            { from: block.to, to: neighbor.to },
            { from: block.from, insert: neighbor.text + state.lineBreak },
        ]
        : [
            { from: neighbor.from, to: block.from },
            { from: block.to, insert: state.lineBreak + neighbor.text },
        ];
    // The inverse permutation is stated from the block's position after the
    // move, where it sits on the side it moved to.
    const after = forward
        ? { first: block.first + 1, last: block.last + 1 }
        : { first: block.first - 1, last: block.last - 1 };
    return {
        changes,
        selection: state.selection.map(state.changes(changes), forward ? 1 : -1),
        effects: permuteBreakpoints.of({
            map: (lines) => movedLines(lines, block, forward),
            invert: (lines) => movedLines(lines, after, !forward),
        }),
        scrollIntoView: true,
        userEvent: 'move.line',
        // The marker effect carries line numbers of this document only, so
        // the event must not merge with the edits around it in history: a
        // merged event would replay those numbers against another document.
        annotations: isolateHistory.of('full'),
    };
}

/**
 * Builds the transaction that duplicates the selected rule lines, placing the
 * copy on the side the direction names and copying the enabled markers onto
 * it. The caret follows the rule it was on, so the duplicate appears next to
 * it without the caret jumping onto the copy.
 *
 * @param state The editor state.
 * @param forward Whether the copy is inserted below the selected lines.
 * @returns The transaction spec, or `null` when the editor is read-only.
 */
export function copyRuleLines(state: EditorState, forward: boolean): TransactionSpec | null {
    if (state.readOnly) {
        return null;
    }
    const block = selectedLineBlock(state);
    const text = state.doc.slice(block.from, block.to);
    const changes = forward
        // Below the block: the block itself does not move.
        ? [{ from: block.to, insert: state.lineBreak + text }]
        // Above the block: the block moves down by one copy.
        : [{ from: block.from, insert: text + state.lineBreak }];
    return {
        changes,
        selection: state.selection.map(state.changes(changes), forward ? -1 : 1),
        effects: replaceBreakpoints.of(copiedLines(enabledRuleLines(state), block, forward)),
        scrollIntoView: true,
        userEvent: 'input.copyline',
        // Isolated like the move: the effect's line numbers are specific to
        // this document.
        annotations: isolateHistory.of('full'),
    };
}

/**
 * Builds the transaction that deletes the selected rule lines together with
 * their enabled markers. The caret lands on the line that takes their place.
 *
 * @param state The editor state.
 * @returns The transaction spec, or `null` when there is nothing to delete.
 */
export function deleteRuleLines(state: EditorState): TransactionSpec | null {
    if (state.readOnly) {
        return null;
    }
    const block = selectedLineBlock(state);
    if (state.doc.length === 0) {
        return null;
    }
    // Delete the break before the block, so the line that follows takes its
    // place; the first line has no break to consume and takes the one after.
    const from = block.from > 0 ? block.from - 1 : 0;
    const to = block.from > 0 ? block.to : Math.min(state.doc.length, block.to + 1);
    const deleted = block.last - block.first + 1;
    const lines = enabledRuleLines(state)
        .filter((line) => line < block.first || line > block.last)
        .map((line) => (line > block.last ? line - deleted : line));
    // The break in front of the block is gone, so the line that takes its
    // place starts right after it; the first line has no break to consume.
    const anchor = Math.min(block.from > 0 ? from + 1 : 0, state.doc.length - (to - from));
    return {
        changes: { from, to },
        selection: { anchor },
        effects: replaceBreakpoints.of(lines),
        scrollIntoView: true,
        userEvent: 'delete.line',
        // `delete.line` is joinable by default; the effect's line numbers are
        // specific to this document, so the event must stay on its own.
        annotations: isolateHistory.of('full'),
    };
}
