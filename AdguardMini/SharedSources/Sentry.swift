// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Sentry.swift
//  AdguardMini
//

import Foundation
import AML
import AGSentry

// MARK: Shared Sentry Utilities

enum SharedSentryUtilities {
    /// Tries to start Sentry crash reporter for app plugins.
    ///
    /// On crash occurred crash events are saved on disk.
    /// - Parameters:
    ///   - subsystem: Crash event is send to Sentry with tag 'component' = subsystem.name.
    ///   - tags: Tags for context.
    static func startSentryForPlugin(subsystem: Subsystem, tags: [String: String] = [:]) {
        guard let cachesPath = Self.adguardCachesDirectoryPath else {
            LogError("AdGuard caches path must be set")
            return
        }

        SentryUtilities.startSentryForPlugin(
            name: subsystem.name,
            tags: tags.merging(["update.channel": BuildConfig.AG_CHANNEL]) { old, _ in old },
            cachesPath: cachesPath
        )
    }

    static let adguardCachesDirectoryPath: String? = {
        Self.sentryStorage.buildUrl(relativePath: "", with: nil).path
    }()

    private static let sentryStorage: SentryStorage = SentryStorageImpl()
}
