// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WatchdogManager.swift
//  AdguardMini
//

import Foundation
import AML

// MARK: - WatchdogManager

protocol WatchdogManager {
    func startWatchdog()
}

// MARK: - WatchdogManagerImpl

final class WatchdogManagerImpl: WatchdogManager {
    func startWatchdog() {
        guard let watchdogUrl = Bundle.main.url(
            forAuxiliaryExecutable: BuildConfig.AG_WATCHDOG_PRODUCT_NAME
        ) else {
            LogError("Failed to obtain watchdog path")
            return
        }

        let appPath = Bundle.main.bundlePath
        let pid = String(getpid())

        do {
            try Process.run(watchdogUrl, arguments: [appPath, pid])
        } catch {
            LogError("Can't spawn watchdog: \(error)")
            return
        }
        LogInfo("Watchdog was started.")
    }
}
