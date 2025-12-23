// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariBlockerType.swift
//  AdguardMini
//

import Foundation

enum SafariBlockerType: Codable, CaseIterable {
    case general
    case privacy
    case security
    case socialWidgetsAndAnnoyances
    case other
    case custom
    case advanced

    /// Gets corresponding safari extension bundle id string for groupKey value
    var bundleId: String {
        switch self {
        case .general:
            BuildConfig.AG_BLOCKER_GENERAL_BUNDLEID
        case .privacy:
            BuildConfig.AG_BLOCKER_PRIVACY_BUNDLEID
        case .security:
            BuildConfig.AG_BLOCKER_SECURITY_BUNDLEID
        case .socialWidgetsAndAnnoyances:
            BuildConfig.AG_BLOCKER_SOCIAL_BUNDLEID
        case .other:
            BuildConfig.AG_BLOCKER_OTHER_BUNDLEID
        case .custom:
            BuildConfig.AG_BLOCKER_CUSTOM_BUNDLEID
        case .advanced:
            BuildConfig.AG_POPUP_EXTENSION_BUNDLEID
        }
    }
}
