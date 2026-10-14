// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/** Mirror console output to Swift `jsLog` handler. */
/* eslint-disable no-console */

/** Levels expected by `JsLogMessageHandler.swift`. */
type LogLevel = 'info' | 'dbg' | 'warn' | 'error';

/** Shape of the captured original console methods. */
type ConsoleMethods = {
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
};

let consoleForwardingInstalled = false;

/**
 * The true original console methods, captured before any override so the
 * overrides can chain to them without recursing.
 */
let origConsole: ConsoleMethods | null = null;

/** Forward serialized log args to the native `jsLog` handler. */
const forwardToSwift = (level: LogLevel, args: unknown[]): void => {
    // Guard webkit-absent hosts.
    const handler = window.webkit?.messageHandlers?.jsLog;
    if (handler) {
        const message = args.map((a) => {
            if (typeof a === 'string') {
                return a;
            }
            if (a instanceof Error) {
                // `JSON.stringify` on an `Error` returns `{}` and would
                // forward empty diagnostics; mirror the message/stack the
                // bridge exists to capture.
                return `${a.name}: ${a.message}`;
            }
            try {
                return JSON.stringify(a);
            } catch {
                try {
                    return String(a);
                } catch {
                    // `toString`/`Symbol.toPrimitive` can also throw;
                    // never let serialization break the caller.
                    return '[unserializable]';
                }
            }
        }).join(' ');
        try {
            handler.postMessage({ level, message });
        } catch {
            // Logging must not break caller.
        }
    }
};

/** Install console-to-Swift log forwarding and `window.log` fallback. */
export function installConsoleLogForwarding(): void {
    if (consoleForwardingInstalled) {
        return;
    }
    consoleForwardingInstalled = true;

    // Capture the true originals before overriding, so the overrides can
    // chain to them without recursing.
    origConsole = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        error: console.error.bind(console),
        debug: console.debug.bind(console),
        warn: console.warn.bind(console),
    };

    applyConsoleOverrides();

    // `window.log` fallback before module logger initialization.
    window.log = {
        info: (...args: unknown[]) => console.log(...args),
        // Route through the (overridden) `console.debug` so the level stays
        // `'dbg'` in the native `[JS:<module>]` tag instead of `console.log`'s
        // `'info'`.
        dbg: (...args: unknown[]) => console.debug(...args),
        error: (...args: unknown[]) => console.error(...args),
    };
}

/** Applies the console→Swift overrides using the captured originals. */
function applyConsoleOverrides(): void {
    const original = origConsole;
    if (!original) {
        return;
    }
    console.log = (...args: unknown[]) => {
        forwardToSwift('info', args);
        original.log(...args);
    };
    console.info = (...args: unknown[]) => {
        forwardToSwift('info', args);
        original.info(...args);
    };
    console.error = (...args: unknown[]) => {
        forwardToSwift('error', args);
        original.error(...args);
    };
    console.debug = (...args: unknown[]) => {
        forwardToSwift('dbg', args);
        original.debug(...args);
    };
    console.warn = (...args: unknown[]) => {
        forwardToSwift('warn', args);
        original.warn(...args);
    };
}
