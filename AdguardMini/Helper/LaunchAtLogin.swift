// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LaunchAtLogin.swift
//  AdguardMini
//

import Cocoa
import AML

func launchMainAppAtLoginIfNeedIt() async {
    guard SharedSettingsStorageImpl().launchOnStartup else {
        LogInfo("Launch at login disabled")
        return
    }
    if let app = NSRunningApplication.runningApplications(withBundleIdentifier: BuildConfig.AG_APP_ID).first {
        LogInfo("There is already a running instance: \(app.bundleURL?.path ?? "\(app)")")
        return
    }

    let adguardMiniUrl = Bundle.main.bundleURL.deletingLastPathComponent() // helper app name
                                              .deletingLastPathComponent() // LoginItems
                                              .deletingLastPathComponent() // Library
                                              .deletingLastPathComponent() // Contents

    LogInfo("AdGuard Login Helper launching \(adguardMiniUrl.path)")

    do {
        let app = try await NSWorkspace.shared.openApplication(
            at: adguardMiniUrl,
            configuration: .silent
        )
        LogInfo("Successfully launched \(adguardMiniUrl.lastPathComponent). Pid: \(app.processIdentifier)")
    } catch {
        LogError("Failed to launch \(adguardMiniUrl.lastPathComponent). \(error)")
    }
}
