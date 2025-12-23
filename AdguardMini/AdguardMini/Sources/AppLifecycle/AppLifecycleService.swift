// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppLifecycleService.swift
//  AdguardMini
//

import AppKit

// MARK: - AppLifecycleService

protocol AppLifecycleService {
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
