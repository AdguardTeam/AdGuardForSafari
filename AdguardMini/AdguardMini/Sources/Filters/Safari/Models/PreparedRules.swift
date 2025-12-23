// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PreparedRules.swift
//  AdguardMini
//

import Foundation
import FLM

typealias FiltersPreparedForGrouping = [Int: [String]]

/// Structure contains rules lists grouping by
struct PreparedRules {
    /// Container for rules from filters with regular groups
    private(set) var data: FiltersPreparedForGrouping = [:]
    /// Rules count
    private(set) var overallCount: Int = 0
    /// User rules must be added after any rules
    private(set) var userRulesList: [String] = []
    /// Rules for filters, which bound to serviceGroup
    private(set) var serviceGroups: [String] = []

    private let userRulesId: Int
    private let serviceGroupId: Int

    init(userRulesId: Int, specialGroupId: Int) {
        self.userRulesId = userRulesId
        self.serviceGroupId = specialGroupId
    }

    /// Adds and distributes filters
    mutating func add(filterList: ActiveFilterInfo, newRules: [String]) {
        // User Rules
        if filterList.filterId == self.userRulesId {
            self.userRulesList = newRules
            self.overallCount += newRules.count

            return
        }

        // Filters from service groups
        if filterList.groupId == self.serviceGroupId {
            self.overallCount += newRules.count
            self.serviceGroups.append(contentsOf: newRules)
            return
        }

        let groupId = filterList.groupId
        var currentGroup = self.data[groupId] ?? []
        currentGroup.append(contentsOf: newRules)
        self.data[groupId] = currentGroup

        self.overallCount += newRules.count
    }

    mutating func reset() {
        self.data = [:]
        self.overallCount = 0
        self.userRulesList = []
        self.serviceGroups = []
    }
}
