// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { findCosmeticRuleMarker } from '@adg/rules-builder';
import { invertedEffects } from '@codemirror/commands';
import { MapMode, RangeSet, StateEffect, StateField, Transaction } from '@codemirror/state';
import { gutter, GutterMarker } from '@codemirror/view';

import type { EditorState, Extension, Text } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Default gutter marker color when no custom color is provided.
 */
const DEFAULT_MARKER_COLOR = '#67B279';

/**
 * Default gutter marker markup (a checkmark) when no custom HTML is provided.
 */
const DEFAULT_MARKER_HTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.9888 3.24536C14.4056 3.60773 14.4497 4.23936 14.0873 4.65614L7.13182 12.6561C6.94683 12.8689 6.68062 12.9937 6.39875 12.9998C6.11688 13.0059 5.84553 12.8927 5.65154 12.6881L1.94039 8.77448C1.56037 8.37373 1.57718 7.74079 1.97793 7.36077C2.37868 6.98075 3.01163 6.99756 3.39165 7.39831L6.34505 10.5128L12.578 3.34389C12.9404 2.92711 13.572 2.88299 13.9888 3.24536Z" fill="#67B279"/></svg>';

/**
 * Creates the marker DOM factory used for enabled rules in the gutter.
 *
 * @param options Color and inner HTML for the marker.
 * @returns A factory producing marker elements.
 */
export function createMarker(options: { color?: string; innerHTML?: string }): () => HTMLElement {
    return () => {
        const marker = document.createElement('div');
        marker.style.color = options.color || DEFAULT_MARKER_COLOR;
        marker.innerHTML = options.innerHTML || DEFAULT_MARKER_HTML;
        return marker;
    };
}

/**
 * Gutter marker rendered for an enabled rule line. Owns the (mutable) DOM
 * factory used to render markers, grouped as static members instead of loose
 * module-level state.
 */
class BreakpointMarker extends GutterMarker {
    private static factory: () => HTMLElement = createMarker({});

    /**
     * Sets the DOM factory used to render enabled-rule markers.
     *
     * @param make Factory producing a marker element.
     */
    public static setFactory(make: () => HTMLElement): void {
        this.factory = make;
    }

    /**
     * Renders the marker element via the current factory.
     *
     * @returns The marker element.
     */
    public override toDOM(): HTMLElement {
        return BreakpointMarker.factory();
    }
}

/**
 * Effect that toggles the enabled marker for the line at the given document
 * position (the line's start offset).
 */
export const toggleBreakpoint = StateEffect.define<number>();

/**
 * Effect that replaces the enabled markers with the given 1-based rule line
 * numbers. Line numbers, not offsets, are the payload: the line-level
 * commands (`lib/lineCommands`) know which rules end up where without
 * knowing the offsets the change produced, and the field resolves them
 * against the transaction's own document.
 */
export const replaceBreakpoints = StateEffect.define<number[]>();

/**
 * Effect that enables the given 1-based rule line numbers, leaving every
 * other marker in place. Unlike {@link toggleBreakpoint} it is idempotent,
 * so it can be replayed safely by history inversion and by the automatic
 * enable paths (a new `Enter` line, a paste).
 */
export const enableBreakpoints = StateEffect.define<number[]>();

/**
 * Effect that disables the given 1-based rule line numbers, leaving every
 * other marker in place. The inverse of {@link enableBreakpoints}: history
 * uses it to undo a line merge that carried a marker onto the line above,
 * which had no marker of its own.
 */
export const disableBreakpoints = StateEffect.define<number[]>();

/**
 * A line-number permutation of the enabled markers together with its
 * reverse. A line command whose markers cannot be mapped positionally — a
 * swapped line looks deleted to the mapping — describes the change with it
 * instead.
 */
type BreakpointPermutation = {
    /** Maps line numbers before the change to line numbers after it. */
    map(lines: number[]): number[];
    /** Maps line numbers after the change back to line numbers before it. */
    invert(lines: number[]): number[];
};

/**
 * Effect that replaces the enabled markers with an explicit line-number
 * permutation, bypassing the positional mapping.
 *
 * Unlike {@link replaceBreakpoints}, the effect carries its own inverse:
 * history replays the reverse permutation on undo against the markers
 * present at that moment, so flags toggled after the command survive the
 * undo.
 */
export const permuteBreakpoints = StateEffect.define<BreakpointPermutation>();

/**
 * Effect recording the 1-based line a new `Enter` line occupies, or `null`
 * to clear it. The line is enabled automatically once it has non-comment
 * content (v1 semantics).
 */
export const setEnterLine = StateEffect.define<number | null>();

/**
 * Value of the marker field: the enabled-rule markers plus the pending
 * `Enter` line they are updated with.
 */
type BreakpointState = {
    /** Enabled-rule markers. */
    markers: RangeSet<GutterMarker>;
    /** 1-based line created by `Enter` awaiting content, or `null`. */
    enterLine: number | null;
};

/**
 * State field holding the enabled-rule markers and the pending `Enter` line.
 */
const breakpointField = StateField.define<BreakpointState>({
    create: () => ({ markers: RangeSet.empty, enterLine: null }),
    update(value, tr) {
        let markers = value.markers;
        let enterLine = value.enterLine;
        // A permutation is stated in line numbers and replaces the positional
        // mapping: applying both would move the markers twice. Joined history
        // events chain their permutations, each one relative to the document
        // the previous one produced, so they are applied in order.
        const permutations = tr.effects.filter(
            (effect): effect is StateEffect<BreakpointPermutation> => effect.is(permuteBreakpoints),
        );
        if (permutations.length) {
            let lines = markerLines(value.markers, tr.startState.doc);
            permutations.forEach((effect) => {
                lines = effect.value.map(lines);
            });
            markers = breakpointsForLines(tr.newDoc, lines);
        } else if (tr.docChanged) {
            markers = mapBreakpoints(markers, tr);
        }
        if (tr.docChanged) {
            enterLine = mapEnterLine(enterLine, tr);
        }
        tr.effects.forEach((effect) => {
            if (effect.is(toggleBreakpoint)) {
                markers = toggleMarker(markers, effect.value);
            } else if (effect.is(replaceBreakpoints)) {
                markers = breakpointsForLines(tr.newDoc, effect.value);
            } else if (effect.is(enableBreakpoints)) {
                markers = addBreakpoints(markers, tr.newDoc, effect.value);
            } else if (effect.is(disableBreakpoints)) {
                markers = removeBreakpoints(markers, tr.newDoc, effect.value);
            } else if (effect.is(setEnterLine)) {
                enterLine = effect.value;
            }
        });
        // A line created by `Enter` is enabled as soon as it has non-comment
        // content (v1 semantics). Checking it here also covers `Enter` in the
        // middle of a line, whose new line already has text, and the first
        // line of an empty editor.
        if (enterLine !== null && enterLine >= 1 && enterLine <= tr.newDoc.lines) {
            const line = tr.newDoc.line(enterLine);
            if (line.text && !isCommentLine(line.text)) {
                markers = addBreakpoints(markers, tr.newDoc, [enterLine]);
                enterLine = null;
            }
        }
        // Pasted rules are enabled on arrival, except empty lines and
        // comments (v1 semantics).
        if (tr.docChanged && tr.isUserEvent('input.paste')) {
            markers = addBreakpoints(markers, tr.newDoc, pastedLines(tr));
        }
        return { markers, enterLine };
    },
});

/**
 * Toggles the marker at the given document position.
 *
 * @param markers The marker set.
 * @param pos The line-start offset.
 * @returns The updated marker set.
 */
function toggleMarker(markers: RangeSet<GutterMarker>, pos: number): RangeSet<GutterMarker> {
    let has = false;
    markers.between(pos, pos, () => {
        has = true;
    });
    return has
        ? markers.update({ filter: (from) => from !== pos })
        : markers.update({ add: [new BreakpointMarker().range(pos)] });
}

/**
 * Returns the 1-based line numbers that carry a marker in the given set.
 *
 * @param markers The marker set.
 * @param doc The document the markers belong to.
 * @returns The sorted line numbers.
 */
function markerLines(markers: RangeSet<GutterMarker>, doc: Text): number[] {
    const lines: number[] = [];
    markers.between(0, doc.length, (from) => {
        lines.push(doc.lineAt(from).number);
    });
    return lines;
}

/**
 * Builds a marker set from line-start offsets, dropping duplicates.
 *
 * @param positions Line-start offsets in the target document.
 * @returns The marker range set.
 */
function breakpointsForPositions(positions: number[]): RangeSet<GutterMarker> {
    const unique = [...new Set(positions)].sort((a, b) => a - b);
    return RangeSet.of(unique.map((pos) => new BreakpointMarker().range(pos)), true);
}

/**
 * Builds a marker set from 1-based line numbers of the given document.
 *
 * @param doc The document the line numbers refer to.
 * @param lines The 1-based rule line numbers to enable.
 * @returns The marker range set.
 */
function breakpointsForLines(doc: Text, lines: number[]): RangeSet<GutterMarker> {
    return breakpointsForPositions(
        lines.filter((line) => line >= 1 && line <= doc.lines).map((line) => doc.line(line).from),
    );
}

/**
 * Adds markers for the given 1-based line numbers without removing any
 * existing marker.
 *
 * @param markers The marker set.
 * @param doc The document the line numbers refer to.
 * @param lines The 1-based rule line numbers to enable.
 * @returns The updated marker set.
 */
function addBreakpoints(markers: RangeSet<GutterMarker>, doc: Text, lines: number[]): RangeSet<GutterMarker> {
    const positions: number[] = [];
    markers.between(0, doc.length, (from) => {
        positions.push(from);
    });
    lines.forEach((line) => {
        if (line >= 1 && line <= doc.lines) {
            positions.push(doc.line(line).from);
        }
    });
    return breakpointsForPositions(positions);
}

/**
 * Removes the markers of the given 1-based line numbers without touching
 * any other marker.
 *
 * @param markers The marker set.
 * @param doc The document the line numbers refer to.
 * @param lines The 1-based rule line numbers to disable.
 * @returns The updated marker set.
 */
function removeBreakpoints(markers: RangeSet<GutterMarker>, doc: Text, lines: number[]): RangeSet<GutterMarker> {
    const positions = new Set(
        lines.filter((line) => line >= 1 && line <= doc.lines).map((line) => doc.line(line).from),
    );
    if (!positions.size) {
        return markers;
    }
    return markers.update({ filter: (from) => !positions.has(from) });
}

/**
 * Reports whether a marker sits at the given line-start position.
 *
 * @param markers The marker set.
 * @param pos The line-start offset.
 * @returns True when a marker exists at `pos`.
 */
function hasMarkerAt(markers: RangeSet<GutterMarker>, pos: number): boolean {
    let has = false;
    markers.between(pos, pos, () => {
        has = true;
    });
    return has;
}

/**
 * Collects the transaction's deleted ranges (pre-change offsets), skipping
 * pure insertions.
 *
 * @param tr The transaction carrying the change.
 * @returns The deleted ranges.
 */
function deletedRanges(tr: Transaction): { from: number; to: number }[] {
    const ranges: { from: number; to: number }[] = [];
    tr.changes.iterChangedRanges((fromA, toA) => {
        if (toA > fromA) {
            ranges.push({ from: fromA, to: toA });
        }
    });
    return ranges;
}

/**
 * Reports whether the change removed the line itself rather than its text.
 *
 * The line is gone only when the deletion also reaches one of its breaks:
 * replacing a rule's whole text leaves its line in place, and losing only
 * the break in front of it merges the rule into the line above instead of
 * deleting it.
 *
 * @param deleted The change's deleted ranges, in pre-change offsets.
 * @param lineFrom The line's start offset.
 * @param lineTo The line's end offset.
 * @returns True when the line's text and a break next to it were deleted.
 */
function lineDeleted(deleted: { from: number; to: number }[], lineFrom: number, lineTo: number): boolean {
    return deleted.some((range) => range.from <= lineFrom && range.to >= lineTo
        && (range.from < lineFrom || range.to > lineTo));
}

/**
 * Maps one marker through a change.
 *
 * A marker is anchored to its rule, not to a raw offset: when the two
 * associations of a line start differ, the one that still carries the
 * marker's line text wins. Without that preference a marker jumps to the
 * text inserted in front of it — the empty line `Enter` creates above an
 * enabled rule, or the block pasted before it. Inserted whole lines are
 * recognized without the text check, which cannot tell two identical rules
 * apart.
 *
 * @param tr The transaction carrying the change.
 * @param deleted The transaction's deleted ranges.
 * @param from The marker's line-start offset before the change.
 * @returns The line-start offset the marker keeps, or `null` when its line
 *          was deleted or turned into a comment.
 */
function mapMarker(tr: Transaction, deleted: { from: number; to: number }[], from: number): number | null {
    const oldDoc = tr.startState.doc;
    const line = oldDoc.lineAt(from);
    if (lineDeleted(deleted, line.from, line.to)) {
        return null;
    }
    const before = tr.changes.mapPos(from, -1, MapMode.TrackDel);
    const after = tr.changes.mapPos(from, 1, MapMode.TrackDel);
    let pos = before ?? after;
    if (before !== null && after !== null && before !== after
        && (wholeLinesInsertedAt(tr, from)
            || (tr.newDoc.lineAt(after).text === line.text
                && tr.newDoc.lineAt(before).text !== line.text))) {
        pos = after;
    }
    if (pos === null) {
        return null;
    }
    const target = tr.newDoc.lineAt(pos);
    // Comment lines cannot carry an enabled marker (see `isCommentLine`): a
    // change that turns the line into a comment — typing `!` at its start,
    // replacing its text with a comment, merging it into a comment line
    // above — drops the marker instead of leaving it on a line that is no
    // longer a rule.
    return isCommentLine(target.text) ? null : target.from;
}

/**
 * Reports whether the change inserts whole lines exactly at the given
 * position, which pushes the line that starts there down.
 *
 * The inserted text must end with a line break, so the marker keeps its own
 * rule line instead of the fragment the insertion created above it. The
 * line text cannot tell two identical rules apart.
 *
 * @param tr The transaction carrying the change.
 * @param pos The line-start offset before the change.
 * @returns True when whole lines were inserted at `pos`.
 */
function wholeLinesInsertedAt(tr: Transaction, pos: number): boolean {
    let whole = false;
    tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
        if (fromA === pos && toA === pos && inserted.lines > 1 && inserted.line(inserted.lines).length === 0) {
            whole = true;
        }
    });
    return whole;
}

/**
 * Maps the enabled markers through a document change. Markers whose line was
 * deleted are dropped, as are the ones whose line turned into a comment; the
 * ones merged into the previous line (a deleted line break) stay on that
 * line.
 *
 * Markers the change does not touch keep their line start by construction,
 * so they are mapped with arithmetic alone. Only the markers on a change
 * boundary — and the ones inside a deleted range — take the line-lookup
 * path: the common typing edit stays O(markers) without a line search per
 * marker, which matters on large rule sets.
 *
 * @param markers The markers before the change.
 * @param tr The transaction carrying the change.
 * @returns The mapped marker range set.
 */
function mapBreakpoints(markers: RangeSet<GutterMarker>, tr: Transaction): RangeSet<GutterMarker> {
    const oldDoc = tr.startState.doc;
    const deleted = deletedRanges(tr);
    const positions: number[] = [];
    markers.between(0, oldDoc.length, (from) => {
        const before = tr.changes.mapPos(from, -1, MapMode.TrackDel);
        const after = tr.changes.mapPos(from, 1, MapMode.TrackDel);
        const insideDeletion = deleted.length > 0
            && deleted.some((range) => range.from <= from && range.to >= from);
        if (before !== null && before === after && !insideDeletion) {
            positions.push(before);
            return;
        }
        const pos = mapMarker(tr, deleted, from);
        if (pos !== null) {
            positions.push(pos);
        }
    });
    return breakpointsForPositions(positions);
}

/**
 * The marker restoration history stores for a change: the 1-based lines to
 * enable again and the ones to disable again.
 */
type BreakpointRestore = {
    /** Lines whose markers the change drops or merges upward. */
    enable: number[];
    /** Lines that gained a marker only by a merge and must lose it. */
    disable: number[];
};

/**
 * Returns the markers a change drops or merges into the line above, so
 * history can restore them when the change is undone.
 *
 * `mapBreakpoints` resolves the marker positions itself, so only the
 * markers that lose their own line need an effect: the ones the change
 * deletes or turns into comments (restored on their line) and the ones it
 * merges upward (moved back down, with the line they merged into disabled
 * when it had no marker of its own).
 *
 * @param tr The transaction carrying the change.
 * @returns The 1-based line numbers to enable and disable on undo.
 */
function lostBreakpoints(tr: Transaction): BreakpointRestore {
    const markers = tr.startState.field(breakpointField).markers;
    const oldDoc = tr.startState.doc;
    const deleted = deletedRanges(tr);
    const restore: BreakpointRestore = { enable: [], disable: [] };

    /**
     * Records the marker at `from` when the change lost its line.
     *
     * @param from The marker's line-start offset before the change.
     * @param mergeStart Start of the deleted range the marker is inside, or
     *                   `null` when the marker is not inside one.
     */
    const recordLost = (from: number, mergeStart: number | null): void => {
        const line = oldDoc.lineAt(from);
        const mapped = mapMarker(tr, deleted, from);
        if (mapped === null) {
            restore.enable.push(line.number);
            return;
        }
        // A deletion that reaches the line start from before it merges
        // the line into the one above; the marker follows the text up.
        if (mergeStart !== null && mergeStart < line.from) {
            restore.enable.push(line.number);
            if (!hasMarkerAt(markers, oldDoc.lineAt(mergeStart).from)) {
                restore.disable.push(tr.newDoc.lineAt(mapped).number);
            }
        }
    };

    deleted.forEach((range) => {
        markers.between(range.from, range.to, (from) => recordLost(from, range.from));
    });
    // A pure insertion has no deleted range to scan, but it can still lose a
    // marker by turning the line into a comment — typing `!` at its start.
    tr.changes.iterChangedRanges((fromA, toA) => {
        if (fromA === toA) {
            markers.between(fromA, fromA, (from) => recordLost(from, null));
        }
    });
    return restore;
}

/**
 * Maps the pending `Enter` line through a change. The pending state is
 * dropped when the change removes a break the line depends on — the one in
 * front of it or the one that ends it — so a later edit cannot enable a
 * rule that merely moved onto the recorded line number. A deletion that
 * only removes text from the line keeps the line and its pending state.
 *
 * @param line The pending 1-based line number, or `null`.
 * @param tr The transaction carrying the change.
 * @returns The mapped 1-based line number, or `null` when it is gone.
 */
function mapEnterLine(line: number | null, tr: Transaction): number | null {
    if (line === null) {
        return null;
    }
    const oldDoc = tr.startState.doc;
    if (line < 1 || line > oldDoc.lines) {
        return null;
    }
    const { from: start, to: end } = oldDoc.line(line);
    let removed = false;
    tr.changes.iterChangedRanges((fromA, toA) => {
        if (toA > fromA && ((fromA < start && toA >= start) || (fromA <= start && toA > end))) {
            removed = true;
        }
    });
    if (removed) {
        return null;
    }
    const mapped = tr.changes.mapPos(start, 1, MapMode.TrackDel);
    return mapped === null ? null : tr.newDoc.lineAt(mapped).number;
}

/**
 * Returns the 1-based number of the line a newline insertion created.
 *
 * `Enter` at the start of a line leaves the caret on the line that follows
 * the inserted break. That line is the created one unless it carries content
 * of its own — the pre-existing rule the caret sits on — in which case the
 * created line is the empty one above it.
 *
 * @param state The post-insert editor state.
 * @param atLineStart Whether the caret was at the start of its line before
 *                    the insertion.
 * @returns The 1-based number of the created line.
 */
export function enterLineNumber(state: EditorState, atLineStart: boolean): number {
    const line = state.doc.lineAt(state.selection.main.head).number;
    return atLineStart && state.doc.line(line).text ? line - 1 : line;
}

/**
 * Returns the 1-based numbers of the lines a paste created in full, skipping
 * empty lines and comments. A line the paste only edited — a fragment
 * replaced inside it — is not a pasted rule and keeps its enabled state
 * (v1 semantics).
 *
 * @param tr The paste transaction.
 * @returns The pasted rule line numbers.
 */
function pastedLines(tr: Transaction): number[] {
    const lines: number[] = [];
    tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
        if (toB <= fromB) {
            return;
        }
        const first = tr.newDoc.lineAt(fromB).number;
        // A line that starts exactly at `toB` is not part of the inserted
        // text (the paste ended with a line break), so the last candidate is
        // the line containing the final character.
        const last = tr.newDoc.lineAt(toB - 1).number;
        for (let line = first; line <= last; line += 1) {
            const { from, to, text } = tr.newDoc.line(line);
            if (from >= fromB && to <= toB && text && !isCommentLine(text)) {
                lines.push(line);
            }
        }
    });
    return lines;
}

/**
 * Restores the enabled markers when a document change is undone or redone.
 *
 * Ordinary edits keep their markers through the mapping, so nothing is
 * recorded for them: only the markers a change actually loses — dropped or
 * merged into the line above — are reported. A line command whose markers
 * cannot be mapped positionally — a swap — carries its reverse permutation
 * instead. Snapshotting the whole set would revert toggles made after the
 * edit on undo and would accumulate one full set per keystroke in history.
 */
const breakpointInversion = invertedEffects.of((tr) => {
    if (!tr.docChanged) {
        return [];
    }
    const permutations = tr.effects.filter(
        (effect): effect is StateEffect<BreakpointPermutation> => effect.is(permuteBreakpoints),
    );
    if (permutations.length) {
        // The inverse of a chain is the chain of inverses, in reverse order.
        return permutations
            .map((effect) => permuteBreakpoints.of({ map: effect.value.invert, invert: effect.value.map }))
            .reverse();
    }
    const { enable, disable } = lostBreakpoints(tr);
    const effects: StateEffect<unknown>[] = [];
    if (enable.length) {
        effects.push(enableBreakpoints.of(enable));
    }
    if (disable.length) {
        effects.push(disableBreakpoints.of(disable));
    }
    return effects;
});

/**
 * Editor extension providing the enabled-rule gutter and its state field.
 * Clicking the gutter toggles the enabled marker of the clicked line and
 * reports the toggle through `options.onToggle` — a gutter click changes no
 * text, so a document-change listener never sees it.
 *
 * The `@adguard/rules-editor` v2 breakpoint gutter has no click handling, and
 * its `Mod-/` hotkey both toggles the marker and comments the line; this local
 * implementation restores the v1 behavior (toggle only), so the library's
 * `withBreakpoints` stays disabled and the two states cannot diverge.
 *
 * @param options Optional toggle callback invoked after a gutter toggle.
 * @returns A CodeMirror 6 extension.
 */
export function breakpointState(options: { onToggle?(): void } = {}): Extension {
    return [
        breakpointField,
        breakpointInversion,
        gutter({
            class: 'cm-breakpoint-gutter',
            markers: (view) => view.state.field(breakpointField).markers,
            initialSpacer: () => new BreakpointMarker(),
            domEventHandlers: {
                mousedown(view, line) {
                    // Comment lines cannot be enabled (see `isCommentLine`),
                    // and the editor is frozen while rules load over RPC.
                    if (!view.state.readOnly && !isCommentLine(view.state.doc.lineAt(line.from).text)) {
                        view.dispatch({ effects: toggleBreakpoint.of(line.from) });
                        options.onToggle?.();
                    }
                    // Consume the event so the browser does not start a text
                    // selection or move the cursor.
                    return true;
                },
            },
        }),
    ];
}

/**
 * Reports whether an enabled marker exists at the given line-start position.
 *
 * @param state The editor state.
 * @param pos The line start offset.
 * @returns True if a marker exists at `pos`.
 */
export function isBreakpointAt(state: EditorState, pos: number): boolean {
    return hasMarkerAt(state.field(breakpointField).markers, pos);
}

/**
 * Returns the 1-based line numbers that carry an enabled marker.
 *
 * @param state The editor state.
 * @returns The sorted list of enabled line numbers.
 */
export function enabledRuleLines(state: EditorState): number[] {
    return markerLines(state.field(breakpointField).markers, state.doc);
}

/**
 * Reports whether a rule text is a comment line (`!`-prefixed, or `#`-prefixed
 * without a cosmetic-rule marker). Comment lines cannot carry an enabled
 * marker.
 *
 * @param line The rule text.
 * @returns True when the line is a comment.
 */
export function isCommentLine(line: string): boolean {
    return line.startsWith('!') || (line.startsWith('#') && findCosmeticRuleMarker(line)[0] === -1);
}

/**
 * Reads the enabled flags and rule texts of every document line. Empty lines
 * are separators, not rules (v1 semantics): they are skipped, so a trailing
 * newline never becomes an empty rule that would reach FLM.
 *
 * @param state The editor state.
 * @returns One entry per non-empty line with its enabled flag and text.
 */
export function rulesFromState(state: EditorState): { enabled: boolean; rule: string }[] {
    const enabled = new Set(enabledRuleLines(state));
    const rules: { enabled: boolean; rule: string }[] = [];
    for (let i = 1; i <= state.doc.lines; i += 1) {
        const line = state.doc.line(i);
        if (!line.text) {
            continue;
        }
        rules.push({ enabled: enabled.has(i), rule: line.text });
    }
    return rules;
}

/**
 * Reads rules and their enabled flags from the editor.
 *
 * @param view The editor view.
 * @returns One entry per non-empty line with its text and enabled flag.
 */
export function getRulesFromEditor(view: EditorView): { enabled: boolean; rule: string }[] {
    return rulesFromState(view.state);
}

/**
 * Builds the document text for the given rule list.
 *
 * @param value Rules with enabled flags.
 * @returns The newline-joined rule texts.
 */
export function computeNewDoc(value: { enabled: boolean; rule: string }[]): string {
    return value.map((v) => v.rule).join('\n');
}

/**
 * Replaces the editor content and restores enabled-rule markers.
 *
 * @param view The editor view.
 * @param value Rules with enabled flags.
 * @param markerOptions Marker color/HTML overrides.
 */
export function setEditorValue(
    view: EditorView,
    value: { enabled: boolean; rule: string }[],
    markerOptions: { color?: string; innerHTML?: string },
): void {
    BreakpointMarker.setFactory(createMarker(markerOptions));
    const doc = computeNewDoc(value);
    // The markers are replaced in the same transaction as the document: a
    // full-document replacement cannot carry them over, and re-enabling them
    // one by one afterwards would leave the seed half applied if a later
    // marker disagreed with the loaded set.
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: doc },
        effects: [
            replaceBreakpoints.of(
                value
                    .map((rule, index) => (rule.enabled && !isCommentLine(rule.rule) ? index + 1 : 0))
                    .filter((line) => line > 0),
            ),
            // An empty editor starts with the first line pending, so the first
            // rule typed into it is enabled (v1 semantics).
            setEnterLine.of(doc === '' ? 1 : null),
        ],
        // The seed is programmatic: it must not become undoable, or `Cmd-Z`
        // right after opening the editor would wipe the loaded rules.
        annotations: Transaction.addToHistory.of(false),
    });
}
