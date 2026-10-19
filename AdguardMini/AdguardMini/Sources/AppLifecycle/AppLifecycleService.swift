// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppLifecycleService.swift
//  AdguardMini
//

import AppKit

// MARK: - AppLifecycleService

/// Terminates the app, optionally restarting it through the watchdog.
///
/// `Sendable` because the service is held by `AppResetService`, an actor, and
/// its only implementation carries an immutable `WatchdogManager`.
protocol AppLifecycleService: Sendable {
    func terminate(restart: Bool)
}

// MARK: - AppLifecycleServiceImpl

final class AppLifecycleServiceImpl {
    // MARK: Private properties

    private let watchdog: WatchdogManager

    // MARK: Init

    init(watchdog: WatchdogManager) {
        self.watchdog = watchdog
    }
}

// MARK: - AppLifecycleService implementation

extension AppLifecycleServiceImpl: AppLifecycleService {
    func terminate(restart: Bool) {
        if restart {
            self.watchdog.startWatchdog()
        }
        Task { @MainActor in
            NSApplication.shared.terminate(self)
        }
    }
}
