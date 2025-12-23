// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SentryUtilities.swift
//  AdguardMini
//

import Foundation
import AML
import AGSentry

// MARK: Shared Sentry Utilities

extension SharedSentryUtilities {
    /// Tries to start Sentry crash reporter for main app.
    /// - Parameter tags: Additional info, which is included into crash report.
    /// - Parameter shouldSend: Closure, which defined to send report or not.
    /// - Returns: Returns true on success.
    static func startSentryForApp(
        tags: [String: String] = [:],
        completion: (() -> Void)? = nil,
        shouldSend: ((SentryEvent) -> Bool)?
    ) {
        guard let cachesPath = Self.adguardCachesDirectoryPath else {
            LogError("AdGuard caches path must be set")
            return
        }

        SentryUtilities.startSentryForApp(
            dsn: SensitiveBuildConfig.SENS_SENTRY_DSN,
            tags: tags.merging(["update.channel": BuildConfig.AG_CHANNEL]) { old, _ in old },
            subsystems: Subsystem.allSubsystems,
            cachesPath: cachesPath,
            productId: ProductInfo.applicationId(),
            completion: completion,
            shouldSend: shouldSend
        )
    }
}
