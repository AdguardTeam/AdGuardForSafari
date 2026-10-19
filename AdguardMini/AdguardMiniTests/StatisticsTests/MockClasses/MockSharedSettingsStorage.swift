// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  MockSharedSettingsStorage.swift
//  AdguardMiniTests
//

import Foundation

/// `@unchecked Sendable` because the double is driven single-threaded by one test.
final class MockSharedSettingsStorage: SharedSettingsStorage, @unchecked Sendable {
    let sharedUserDefaults: UserDefaults = UserDefaults(suiteName: "MockSharedSettingsStorage.\(UUID().uuidString)")!

    var protectionEnabled: Bool = true
    var launchOnStartup: Bool = false
    var advancedRules: Bool = false
    var showSafariToolbarBadge: Bool = false

    private(set) var statisticsResetToken: String?
    private(set) var updateStatisticsResetTokenCalls = 0

    func updateStatisticsResetToken() {
        self.updateStatisticsResetTokenCalls += 1
        self.statisticsResetToken = UUID().uuidString
    }

    func resetStorage() {}
}
