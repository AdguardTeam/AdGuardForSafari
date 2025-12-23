// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppMetadata.swift
//  AdguardMini
//

import Foundation

// MARK: - AppMetadata

protocol AppMetadata: AnyObject {
    var firstStartDate: Date? { get set }

    var wasMigratedFromLegacyApp: Bool { get set }
    var didAttemptLegacyMigration: Bool { get set }

    var rateUsProtectionEnabledDate: Date? { get set }
    var rateUsNoCrashesDate: Date? { get set }
}

// MARK: - AppMetadataImpl

final class AppMetadataImpl: AppMetadata {
    @UserDefault(.firstStartDate)
    var firstStartDate: Date?

    @UserDefault(key: .wasMigratedFromLegacyApp, defaultValue: false)
    var wasMigratedFromLegacyApp: Bool

    @UserDefault(key: .didAttemptLegacyMigration, defaultValue: false)
    var didAttemptLegacyMigration: Bool

    @UserDefault(.rateUsProtectionEnabledDate)
    var rateUsProtectionEnabledDate: Date?

    @UserDefault(.rateUsNoCrashesDate)
    var rateUsNoCrashesDate: Date?

    init() {
        // Migrate metadata
        if self.wasMigratedFromLegacyApp, !self.didAttemptLegacyMigration {
            self.didAttemptLegacyMigration = true
        }
    }
}
