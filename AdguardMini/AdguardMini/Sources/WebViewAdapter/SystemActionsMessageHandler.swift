// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SystemActionsMessageHandler.swift
//  AdguardMini
//

import Foundation
import AppKit
import WebKit
import AML
import ProtoSchema // ScriptMessageHandling test seam (same module).

// MARK: - Test seams

/// Test seam for `NSWorkspace.shared.open`.
protocol LinkOpening: AnyObject {
    func openURL(_ url: URL)
}

/// Test seam for `NSPasteboard.general` writes.
protocol PasteboardWriting: AnyObject {
    func writeString(_ string: String)
}

// MARK: - SystemActionsMessageHandler

/// Handles open-link and clipboard actions.
///
/// Clipboard writes (`systemClipboard`) route through the Swift
/// `NSPasteboard`. Reads have no bridge: the WebKit async clipboard API
/// (`navigator.clipboard`) is not granted to `WKWebView` pages, and text
/// paste works through the DOM `paste` event, whose `clipboardData` carries
/// the text.
final class SystemActionsMessageHandler: NSObject, WKScriptMessageHandler {
    private enum Constants {
        /// Max clipboard payload (1 MiB).
        static let maxClipboardPayloadBytes = 1_048_576
        /// Clipboard rate limiter config.
        static let clipboardCapacity = 2.0
        static let clipboardRefillPerSecond = 2.0
    }

    private let externalLinkGate: ExternalLinkGate
    private let pasteboard: PasteboardWriting
    private let clipboardLimiter: TokenBucketLimiter

    init(
        externalLinkGate: ExternalLinkGate,
        pasteboard: PasteboardWriting,
        clipboardLimiter: TokenBucketLimiter? = nil
    ) {
        self.externalLinkGate = externalLinkGate
        self.pasteboard = pasteboard
        self.clipboardLimiter = clipboardLimiter ?? TokenBucketLimiter(
            capacity: Constants.clipboardCapacity,
            refillPerSecond: Constants.clipboardRefillPerSecond
        )
        super.init()
    }

    /// Production initializer.
    override convenience init() {
        self.init(
            externalLinkGate: ExternalLinkGate(linkOpener: NSWorkspaceLinkOpener()),
            pasteboard: NSPasteboardWriter()
        )
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        // Privileged actions (open link / write clipboard) must only be
        // Triggered by the module page itself, not by any subframe whose
        // Content is not under our control.
        guard message.frameInfo.isMainFrame else {
            LogError("Ignoring system action from non-main frame: \(message.name)")
            return
        }
        handle(message: message)
    }

    /// Handles message via test seam.
    func handle(message: ScriptMessageHandling) {
        switch message.name {
        case "openLinkInBrowser":
            externalLinkGate.open(candidate: message.body)
        case "systemClipboard":
            self.handleClipboardWrite(message: message)
        default:
            LogDebug("Unknown WKScriptMessage name: \(message.name)")
            return
        }
    }

    private func handleClipboardWrite(message: ScriptMessageHandling) {
        guard let string = message.body as? String else {
            // Log only the body's type, never its content (JS-provided
            // Data may carry sensitive information).
            LogError(
                "systemClipboard: bad body, got \(String(describing: type(of: message.body)))"
            )
            return
        }
        guard string.utf8.count <= Constants.maxClipboardPayloadBytes else {
            LogError(
                "systemClipboard: payload too large (\(string.utf8.count) bytes) — rejected"
            )
            return
        }
        switch clipboardLimiter.tryConsume() {
        case .allowed:
            pasteboard.writeString(string)
        case .limited(let shouldLog):
            if shouldLog {
                LogDebug("systemClipboard: write rate limited — dropping")
            }
        }
    }
}

// MARK: - Production backends

final class NSWorkspaceLinkOpener: LinkOpening {
    func openURL(_ url: URL) {
        NSWorkspace.shared.open(url)
    }
}

final class NSPasteboardWriter: PasteboardWriting {
    func writeString(_ string: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(string, forType: .string)
    }
}
