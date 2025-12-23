// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersDTO.swift
//  AdguardMini
//

import Foundation
import FLM

struct CustomFilterDTO: Codable {
    let downloadUrl: String
    let lastDownloadTime: Int64
    let isEnabled: Bool
    let isTrusted: Bool
    let rules: [String]
    let customTitle: String
    let customDescription: String?

    var filterBody: String {
        self.rules.joined(separator: FilterRule.RULE_SEPARATOR)
    }
}

struct FiltersDTO: Codable {
    let userRules: [String]
    let userRulesEnabled: Bool
    let enabledBaseFilters: [Int]
    let customFilters: [CustomFilterDTO]
}
