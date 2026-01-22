// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterWindowController.swift
//  AdguardMini
//

import Cocoa
import SciterSwift
import SciterSchema
import AML

// MARK: - SciterWindowController

protocol SciterWindowController: AnyObject {
    @MainActor
    func showWindow() async

    /// Show tray window frame at specified coords
    @MainActor
    func showWindowAtCoords(frame: CGRect) async

    /// Hide tray window
    @MainActor
    func hideWindow() async

    /// Tray NSWindow object
    var nsWindow: NSWindow? { get }
}

// MARK: - SciterWindowController

/// Controller for sciter window.
class SciterWindowControllerImpl: NSObject, NSWindowDelegate, SciterWindowController {
    // MARK: Private properties

    /// Sciter tray app
    private let sciterApp: SciterSwift.App

    private let hideOnLoosingFocus: Bool

    // MARK: Init/deinit

    init(
        _ sciterApp: SciterSwift.App,
        windowRect: CGRect,
        archivePath: String,
        hideOnLoosingFocus: Bool
    ) {
        self.hideOnLoosingFocus = hideOnLoosingFocus

        self.sciterApp = sciterApp

        self.sciterApp.setupWindow(
            windowRect: windowRect,
            archivePath: archivePath
        )

        super.init()

        if hideOnLoosingFocus {
            /// Subscribe on loosing focus by sciter window
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(didReceiveHideSignal),
                name: NSWindow.didResignKeyNotification,
                object: self.sciterApp.nswindow
            )
        }

        self.nsWindow?.delegate = self
        LogInfo("[\(type(of: self))] Initialized - rect: \(windowRect), hideOnFocus: \(hideOnLoosingFocus)")
    }

    deinit {
        if hideOnLoosingFocus {
            NotificationCenter.default.removeObserver(self)
        }
        LogDebug("[\(type(of: self))] Deinitialized")
    }

    @MainActor
    func hideWindow() async {
        self.sciterApp.window?.hide()
        UIUtils.removeWindow(self)
        LogDebug("[\(type(of: self))] Window hidden")
    }

    // MARK: Private methods

    /// If we want to hide sciter window forcibly
    @objc private func didReceiveHideSignal(_ sender: Any?) {
        LogDebug("[\(type(of: self))] Window lost focus, hiding...")
        Task(priority: .userInitiated) {
            await self.hideWindow()
        }
    }

// MARK: - SciterWindowController implementation

    var nsWindow: NSWindow? {
        self.sciterApp.nswindow
    }

    @MainActor
    func showWindow() async {
        let wasVisible = self.sciterApp.window?.nswindow?.isVisible ?? false
        await UIUtils.windowWillBeVisible(self)
        self.sciterApp.window?.show()

        // Fix activation in some cases
        let isKey = self.sciterApp.window?.nswindow?.isKeyWindow ?? true
        if !isKey {
            LogDebug("[\(type(of: self))] Window not key after show, activating again...")
            await UIUtils.windowWillBeVisible(self)
        }

        LogDebug("[\(type(of: self))] Window shown (wasVisible: \(wasVisible), isKey: \(isKey). Diagnostic: \(self.sciterApp.diagnosticInfo)")
    }

    /// Shows window at  designated coordinates.
    @MainActor
    func showWindowAtCoords(frame: CGRect) async {
        self.sciterApp.nswindow?.setFrame(frame, display: true)
        self.sciterApp.window?.show()

        LogDebug("[\(type(of: self))] Window shown at frame: \(frame). Diagnostic: \(self.sciterApp.diagnosticInfo)")
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        LogDebug("[\(type(of: self))] Window close requested")
        Task(priority: .userInitiated) {
            await self.hideWindow()
        }
        return false
    }

    @MainActor
    func windowDidResize(_ notification: Notification) {
        guard let window = notification.object as? NSWindow,
            let contentView = window.contentView else { return }

        LogDebug("[\(type(of: self))] Window resized to: \(window.frame.size)")
        contentView.setNeedsDisplay(contentView.bounds)
    }
}

private extension SciterSwift.App {
    var diagnosticInfo: String {
        let currentFrame = self.nswindow?.frame
        let currentFrameString = currentFrame.map { "\($0)" } ?? "none"
        let hasWindow = !self.nswindow.isNil

        return "[\(type(of: self))] hasWindow: \(hasWindow), currentFrame: \(currentFrameString)"
    }
}
