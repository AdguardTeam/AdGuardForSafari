// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppActivationObserver.swift
//  AdguardMini
//

import AppKit
import AML

// MARK: - AppActivationObserver

protocol AppActivationObserver {
    func activatePrevApp()
    func startObserving()
    func stopObserving()
}

// MARK: - AppActivationObserverImpl

final class AppActivationObserverImpl: AppActivationObserver {
    private var previousApp: NSRunningApplication?

    private var isStarted = false

    deinit {
        self.stopObserving()
    }

    func activatePrevApp() {
        LogInfo("Activating previous app")
        self.previousApp?.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
    }

    func startObserving() {
        guard !self.isStarted else { return }
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(applicationDidActivate(_:)),
            name: NSWorkspace.didActivateApplicationNotification,
            object: nil
        )
        self.isStarted = true
    }

    func stopObserving() {
        guard self.isStarted else { return }

        NSWorkspace.shared.notificationCenter.removeObserver(self)
        self.previousApp = nil
        self.isStarted = false
    }

    @objc private func applicationDidActivate(_ notification: Notification) {
        let runningApp = notification.userInfo?[NSWorkspace.applicationUserInfoKey]
        guard let activatedApp = runningApp as? NSRunningApplication else {
            return
        }

        if activatedApp == NSRunningApplication.current {
            LogDebug("Focus on current app")
        } else {
            LogDebug("Focus on another app: \(activatedApp.bundleIdentifier ?? "bundleId is nil")")
            self.previousApp = activatedApp
        }
    }
}
