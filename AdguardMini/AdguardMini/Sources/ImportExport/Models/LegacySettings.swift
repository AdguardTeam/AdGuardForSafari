// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LegacySettings.swift
//  AdguardMini
//

// swiftlint:disable discouraged_optional_boolean
// swiftlint:disable discouraged_optional_collection

import Foundation

extension Legacy {
    // MARK: - Settings

    struct Settings: Codable {
        let protocolVersion: String
        let generalSettings: GeneralSettings?
        let filters: Filters?

        enum CodingKeys: String, CodingKey {
            case protocolVersion = "protocol-version"
            case generalSettings = "general-settings"
            case filters
        }
    }

    // MARK: - Filters

    struct Filters: Codable {
        let enabledGroups: [Int]?
        let enabledFilters: [Int]?
        let customFilters: [ImportCustomFilter]?
        let userFilter: UserFilter?
        let allowlist: Allowlist?

        enum CodingKeys: String, CodingKey {
            case enabledGroups = "enabled-groups"
            case enabledFilters = "enabled-filters"
            case customFilters = "custom-filters"
            case userFilter = "user-filter"
            case allowlist
        }
    }

    // MARK: - Allowlist

    struct Allowlist: Codable {
        let enabled, inverted: Bool?
        let domains, invertedDomains: [String]?

        enum CodingKeys: String, CodingKey {
            case enabled, inverted, domains
            case invertedDomains = "inverted-domains"
        }
    }

    // MARK: - CustomFilter

    struct ImportCustomFilter: Codable {
        let filterID: Int
        let customURL: String
        let enabled: Bool
        let title: String
        let trusted: Bool

        enum CodingKeys: String, CodingKey {
            case filterID = "filterId"
            case customURL = "customUrl"
            case enabled, title, trusted
        }
    }

    // MARK: - UserFilter

    struct UserFilter: Codable {
        let enabled: Bool?
        let rules: String?
    }

    // MARK: - GeneralSettings

    struct GeneralSettings: Codable {
        let appLanguage: String?
        let allowAcceptableAds: Bool?
        let showAppUpdatedDisabled: Bool?
        let updateFiltersPeriod: Int?
        let showTrayIcon: Bool?
        let launchAtLogin: Bool?
        let verboseLogging: Bool?
        let hardwareAccelerationDisabled: Bool?

        enum CodingKeys: String, CodingKey {
            case appLanguage = "app-language"
            case allowAcceptableAds = "allow-acceptable-ads"
            case showAppUpdatedDisabled = "show-app-updated-disabled"
            case updateFiltersPeriod = "update-filters-period"
            case showTrayIcon = "show-tray-icon"
            case launchAtLogin = "launch-at-login"
            case verboseLogging = "verbose-logging"
            case hardwareAccelerationDisabled = "hardware-acceleration-disabled"
        }
    }
}

// swiftlint:enable discouraged_optional_boolean
// swiftlint:enable discouraged_optional_collection
