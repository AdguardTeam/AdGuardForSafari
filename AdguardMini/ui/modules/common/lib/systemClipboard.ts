// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/** Clipboard surface installed on `window.SystemClipboard`. */
export interface SystemClipboardBridge {
    /** Write text to the system clipboard. */
    write(text: string): void;
    /** Alias of {@link write}. */
    writeText(text: string): void;
}

/** Install Swift-backed `window.SystemClipboard`; falls back to `navigator.clipboard`
 *  when the Swift message handler is unavailable.
 */
export function installSystemClipboardBridge(): SystemClipboardBridge {
    // Guard webkit-absent hosts.
    const writeHandler = window.webkit?.messageHandlers?.systemClipboard;

    const bridge: SystemClipboardBridge = {
        write(text: string) {
            if (writeHandler) {
                writeHandler.postMessage(text);
                return;
            }
            // `navigator.clipboard` may be absent (non-secure context, older
            // WKWebView, node test runners) and `writeText` may reject
            // (NotAllowedError); guard availability and swallow the rejection
            // so the copy buttons never throw.
            void navigator.clipboard?.writeText(text)?.catch(() => undefined);
        },
        writeText(text: string) {
            // Documented alias — delegate so the Swift-first fallback logic
            // stays in a single place and cannot diverge.
            this.write(text);
        },
    };

    window.SystemClipboard = bridge;
    return bridge;
}
