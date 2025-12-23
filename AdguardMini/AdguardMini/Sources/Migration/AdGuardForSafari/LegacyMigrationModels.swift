// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LegacyMigrationModels.swift
//  AdguardMini
//

// swiftlint:disable all

import Foundation

/// Namespace for objects related to the migration from the legacy AdGuard for Safari app to the new AdGuard Mini for Mac app.
extension Legacy {

/// Only important values of filter group state from `config.json`.
struct GroupState: Decodable {
    let enabled: Bool?
}

/// Only important values of filter states from `config.json`.
struct FilterState: Decodable {
    let enabled: Bool?
}

/// Custom filter meta from custom\_filters.
struct CustomFilterMetadata: Decodable {
    let filterId: Int?
    let groupId: Int?
    let name: String?
    let description: String?
    let homepage: String?
    let version: String?
    let timeUpdated: String?
    let displayNumber: Int?
    let languages: [String]?
    let expires: String?
    let subscriptionUrl: String?
    let tags: [Int]?
    let loaded: Bool?
    let enabled: Bool?
    let customUrl: String?
    let rulesCount: Int?
    let trusted: Bool?
    let lastUpdateTime: String?
    let lastCheckTime: Int64?
}

/// Representation of Custom Filter stored in `config.json`.
struct CustomFilter {
    let filterId: Int?
    let groupId: Int?
    let name: String?
    let description: String?
    let homepage: String?
    let version: String?
    let timeUpdated: String?
    let displayNumber: Int?
    let languages: [String]?
    let expires: String?
    let subscriptionUrl: String?
    let tags: [Int]?
    let loaded: Bool?
    let enabled: Bool?
    let customUrl: String?
    let rulesCount: Int?
    let trusted: Bool?
    let lastUpdateTime: String?
    let lastCheckTime: Int64?
    let rules: [String]?

    init(metadata: CustomFilterMetadata, rules: [String]?) {
        self.filterId = metadata.filterId
        self.groupId = metadata.groupId
        self.name = metadata.name
        self.description = metadata.description
        self.homepage = metadata.homepage
        self.version = metadata.version
        self.timeUpdated = metadata.timeUpdated
        self.displayNumber = metadata.displayNumber
        self.languages = metadata.languages
        self.expires = metadata.expires
        self.subscriptionUrl = metadata.subscriptionUrl
        self.tags = metadata.tags
        self.loaded = metadata.loaded
        self.enabled = metadata.enabled
        self.customUrl = metadata.customUrl
        self.rulesCount = metadata.rulesCount
        self.trusted = metadata.trusted
        self.lastUpdateTime = metadata.lastUpdateTime
        self.lastCheckTime = metadata.lastCheckTime
        self.rules = rules
    }
}

/// Work with dynamic keys (for example, "filter\_1000", "filter\_1001", etc.).
struct DynamicCodingKeys: CodingKey {
    var stringValue: String
    var intValue: Int?

    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) {
        self.intValue = intValue
        self.stringValue = "\(intValue)"
    }
}

struct UserRulesConfig: Decodable {
    var enabled: Bool?
    var userFilterRules: [String]?

    var defaultAllowlistMode: Bool?
    var allowlistEnabled: Bool?
    var whiteListDomains: [String]?
    var blockListDomains: [String]?

    enum CodingKeys: String, CodingKey {
        case enabled              = "userrules-enabled"
        case userFilterRules      = "filter_0"
        case defaultAllowlistMode = "default-allowlist-mode"
        case allowlistEnabled     = "allowlist-enabled"
        case whiteListDomains     = "white-list-domains"
        case blockListDomains     = "block-list-domains"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        self.userFilterRules = try container.decodeIfPresent([String].self, forKey: .userFilterRules)

        self.enabled = try container.decodeIfPresent(Bool.self, forKey: .enabled)
        self.defaultAllowlistMode = try container.decodeIfPresent(Bool.self, forKey: .defaultAllowlistMode)
        self.allowlistEnabled = try container.decodeIfPresent(Bool.self, forKey: .allowlistEnabled)

        if let whiteListDomainsString = try container.decodeIfPresent(String.self, forKey: .whiteListDomains),
           let whiteListData = whiteListDomainsString.data(using: .utf8) {
            self.whiteListDomains = try JSONDecoder().decode([String].self, from: whiteListData)
        } else {
            self.whiteListDomains = nil
        }

        if let blockListDomainsString = try container.decodeIfPresent(String.self, forKey: .blockListDomains),
           let blockListData = blockListDomainsString.data(using: .utf8) {
            self.blockListDomains = try JSONDecoder().decode([String].self, from: blockListData)
        } else {
            self.blockListDomains = nil
        }
    }

    init(
        enabled: Bool? = nil,
        userFilterRules: [String]? = nil,
        defaultAllowlistMode: Bool? = nil,
        allowlistEnabled: Bool? = nil,
        whiteListDomains: [String]? = nil,
        blockListDomains: [String]? = nil
    ) {
        self.enabled = enabled
        self.userFilterRules = userFilterRules
        self.defaultAllowlistMode = defaultAllowlistMode
        self.allowlistEnabled = allowlistEnabled
        self.whiteListDomains = whiteListDomains
        self.blockListDomains = blockListDomains
    }
}

// MARK: - Main structure

/// Representation of `config.json` file of AdGuard for Safari.
struct Configuration: Decodable {
    let clientId: String?
    let appVersion: String?
    /// Dict [groupId: enabled].
    let groupsState: [Int: Bool]?
    /// Dict [filterId: enabled].
    let filtersState: [Int: Bool]?
    /// Meta from "custom\_filters" field + rules from "filter\_\<id\>".
    let customFilters: [CustomFilter]?
    let userRules: UserRulesConfig?

    let verboseLogging: Bool?

    let adguardDisabled: Bool?
    let showTrayIcon: Bool?
    let launchAtLogin: Bool?
    let allowAcceptableAds: Bool?

    enum CodingKeys: String, CodingKey {
        case clientId                     = "client-id"
        case appVersion                   = "app-version"
        case groupsState                  = "groups-state"
        case filtersState                 = "filters-state"
        case customFiltersMetadata        = "custom_filters"
        case userRules
        case verboseLogging               = "verbose-logging"
        case adguardDisabled              = "adguard-disabled"
        case showTrayIcon                 = "show-tray-icon"
        case launchAtLogin                = "launch-at-login"
        case allowAcceptableAds           = "allow-acceptable-ads"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.appVersion = try container.decodeIfPresent(String.self, forKey: .appVersion)

        // Decode groups-state (JSON-string) and convert keys to Int
        if let groupsStateString = try container.decodeIfPresent(String.self, forKey: .groupsState),
           let groupsData = groupsStateString.data(using: .utf8) {
            let fullGroupsState = try JSONDecoder().decode([String: GroupState].self, from: groupsData)
            var optimizedGroups: [Int: Bool] = [:]
            for (key, value) in fullGroupsState {
                if let intKey = Int(key), let enabled = value.enabled {
                    optimizedGroups[intKey] = enabled
                }
            }
            self.groupsState = optimizedGroups
        } else {
            self.groupsState = nil
        }

        // Decode filters-state (JSON-string) and convert keys to Int
        if let filtersStateString = try container.decodeIfPresent(String.self, forKey: .filtersState),
           let filtersStateData = filtersStateString.data(using: .utf8) {
            let fullFiltersState = try JSONDecoder().decode([String: FilterState].self, from: filtersStateData)
            var optimizedFilters: [Int: Bool] = [:]
            for (key, value) in fullFiltersState {
                if let intKey = Int(key), let enabled = value.enabled {
                    optimizedFilters[intKey] = enabled
                }
            }
            self.filtersState = optimizedFilters
        } else {
            self.filtersState = nil
        }


        // Decode custom filters: join metadatas (JSON-string) with rules from "filter_<id>"
        if let customFiltersString = try container.decodeIfPresent(String.self, forKey: .customFiltersMetadata),
           let customFiltersMetadata = try? JSONDecoder().decode([CustomFilterMetadata].self, from: Data(customFiltersString.utf8)) {
            let topLevelContainer = try decoder.container(keyedBy: DynamicCodingKeys.self)
            var customFiltersTemp = [CustomFilter]()
            for metadata in customFiltersMetadata {
                if let filterId = metadata.filterId {
                    let keyString = "filter_\(filterId)"
                    if let key = DynamicCodingKeys(stringValue: keyString) {
                        let rules = try topLevelContainer.decodeIfPresent([String].self, forKey: key)
                        let customFilter = CustomFilter(metadata: metadata, rules: rules)
                        customFiltersTemp.append(customFilter)
                    }
                }
            }
            self.customFilters = customFiltersTemp
        } else {
            self.customFilters = nil
        }

        self.verboseLogging = try container.decodeIfPresent(Bool.self, forKey: .verboseLogging)
        self.clientId = try container.decodeIfPresent(String.self, forKey: .clientId)

        self.userRules = try UserRulesConfig(from: decoder)

        self.adguardDisabled = try container.decodeIfPresent(Bool.self, forKey: .adguardDisabled)
        self.showTrayIcon = try container.decodeIfPresent(Bool.self, forKey: .showTrayIcon)
        self.launchAtLogin = try container.decodeIfPresent(Bool.self, forKey: .launchAtLogin)
        self.allowAcceptableAds = try container.decodeIfPresent(Bool.self, forKey: .allowAcceptableAds)
    }
}

}

// swiftlint:enable all
