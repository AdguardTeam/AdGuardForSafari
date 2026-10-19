// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppMetadata.swift
//  AdguardMini
//

import Foundation

// MARK: - AppMetadata

/// `Sendable` because the implementation stores every value in `UserDefaults`.
protocol AppMetadata: AnyObject, Sendable {
    var firstStartDate: Date? { get set }

    var wasMigratedFromLegacyApp: Bool { get set }
    var didAttemptLegacyMigration: Bool { get set }

    var rateUsNoCrashesDate: Date? { get set }
    var rateUsStage: RateUsStage { get set }
}

// MARK: - AppMetadataImpl

/// `@unchecked Sendable` because every value lives in `UserDefaults`, which is
/// thread-safe; the property wrappers keep no state of their own.
final class AppMetadataImpl: AppMetadata, @unchecked Sendable {
    @UserDefault(.firstStartDate)
    var firstStartDate: Date?

    @UserDefault(key: .wasMigratedFromLegacyApp, defaultValue: false)
    var wasMigratedFromLegacyApp: Bool

    @UserDefault(key: .didAttemptLegacyMigration, defaultValue: false)
    var didAttemptLegacyMigration: Bool

    @UserDefault(.rateUsNoCrashesDate)
    var rateUsNoCrashesDate: Date?

    @UserDefault(key: .rateUsStage, defaultValue: nil)
    private var rateUsStageRaw: Int?
    var rateUsStage: RateUsStage {
        get {
            if let rawValue = self.rateUsStageRaw {
                return RateUsStage(rawValue: rawValue) ?? .first
            }
            return .first
        }
        set {
            self.rateUsStageRaw = newValue.rawValue
        }
    }

    init() {
        // Migrate metadata
        if self.wasMigratedFromLegacyApp, !self.didAttemptLegacyMigration {
            self.didAttemptLegacyMigration = true
        }
    }
}
