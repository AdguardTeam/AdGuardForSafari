// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FilterDTO.swift
//  AdguardMini
//

// swiftlint:disable discouraged_optional_collection
// swiftlint:disable discouraged_optional_boolean

import Foundation

struct FilterDTO {
    let meta: FilterMetaDTO?
    let rules: [FilterRuleDTO]?
}

struct FilterMetaDTO {
    var filterId:         Int
    var groupId:          Int?
    var timeUpdated:      TimeInterval?
    var name:             String?
    var summary:          String?
    var version:          String?
    var displayNumber:    Int?
    var url:              String?
    var expires:          Int?
    var isCustom:         Bool?
    var homepage:         String?
    var languages:        [String]?
    var tags:             [Int]?

    var isTrusted:   Bool?
    var isEnabled:   Bool?
    var isInstalled: Bool?

    func indexFilterImportantData() -> Self {
        // Default filters: export isInstalled, isEnabled, langs
        FilterMetaDTO(
            filterId: self.filterId,
            groupId: nil,
            timeUpdated: nil,
            name: nil,
            summary: nil,
            version: nil,
            displayNumber: nil,
            url: nil,
            expires: nil,
            isCustom: nil,
            homepage: nil,
            languages: self.languages,
            tags: nil,
            isTrusted: nil,
            isEnabled: self.isEnabled,
            isInstalled: self.isInstalled
        )
    }

    func customFilterImportantData() -> Self {
        FilterMetaDTO(
            filterId: self.filterId,
            groupId: self.groupId,
            timeUpdated: self.timeUpdated,
            name: self.name,
            summary: self.summary,
            version: self.version,
            displayNumber: self.displayNumber,
            url: self.url,
            expires: self.expires,
            isCustom: self.isCustom,
            homepage: self.homepage,
            languages: self.languages,
            tags: nil,
            isTrusted: self.isTrusted,
            isEnabled: self.isEnabled,
            isInstalled: nil
        )
    }

    func clearingTags() -> Self {
        FilterMetaDTO(
            filterId: self.filterId,
            groupId: self.groupId,
            timeUpdated: self.timeUpdated,
            name: self.name,
            summary: self.summary,
            version: self.version,
            displayNumber: self.displayNumber,
            url: self.url,
            expires: self.expires,
            isCustom: self.isCustom,
            homepage: self.homepage,
            languages: self.languages,
            tags: nil,
            isTrusted: self.isTrusted,
            isEnabled: self.isEnabled,
            isInstalled: self.isInstalled
        )
    }
}

struct FilterRuleDTO {
    let ruleText: String
    let isEnabled: Bool
}

// swiftlint:enable discouraged_optional_collection
// swiftlint:enable discouraged_optional_boolean
