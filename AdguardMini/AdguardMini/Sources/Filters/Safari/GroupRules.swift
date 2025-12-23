// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  RulesGrouper.swift
//  AdguardMini
//

import Foundation
import FLM
import OrderedCollections

// MARK: Affinity Directives

let affinityDirective = "!#safari_cb_affinity"
let affinityDirectiveStart = "!#safari_cb_affinity("

// MARK: - Mappings

/// Group rules by content blocker. Advanced not included.
private let groups: [SafariBlockerType] = SafariBlockerType.allCases.filter { $0 != .advanced }

// swiftlint:disable switch_case_on_newline
private extension SafariBlockerType {
    /// Map target safari extension key on filter lists groupId values.
    var filtersGroups: [FiltersDefinedGroup] {
        switch self {
        case .general:                    [.adBlocking, .languageSpecific]
        case .privacy:                    [.privacy]
        case .security:                   [.security]
        case .socialWidgetsAndAnnoyances: [.social, .annoyances]
        case .other:                      [.other]
        case .custom:                     [.custom]
        /// Special case. Advanced rules are created differently.
        case .advanced:                   []
        }
    }
}

private extension AffinityKey {
    /// Map target safari extension key on affinity blocks.
    var blockerGroups: [SafariBlockerType] {
        switch self {
        case .general:                    [.general]
        case .privacy:                    [.privacy]
        case .security:                   [.security]
        case .socialWidgetsAndAnnoyances: [.socialWidgetsAndAnnoyances]
        case .other:                      [.other]
        case .custom:                     [.custom]
        case .all:                        groups
        }
    }
}
// swiftlint:enable switch_case_on_newline

// MARK: - Group rules processor

protocol RulesGrouper {
    func group(preparedFilters: PreparedRules) -> [GroupedRules]
    func groupFilters(filters: [ActiveFilterInfo]) -> [SafariBlockerType: [Int]]
}

/// Groups rules for safari extensions, using groupId from filter, using affinity.
final class RulesGrouperImpl: RulesGrouper {
    // MARK: Private properties

    /// Public entrypoint for grouping process
    func group(preparedFilters: PreparedRules) -> [GroupedRules] {
        var result: [GroupedRules] = []
        var rulesByAffinityBlocks: [SafariBlockerType: [String]] = [:]
        var rulesByGroup: [SafariBlockerType: [String]] = [:]

        for group in groups {
            var groupRules: [String] = []

            for filterGroupId in group.filtersGroups {
                var rulesForGroup = preparedFilters.data[filterGroupId.id] ?? []

                // Will add service groups to "other"
                if filterGroupId == .other && !preparedFilters.serviceGroups.isEmpty {
                    rulesForGroup.append(contentsOf: preparedFilters.serviceGroups)
                }

                self.sortWithAffinityBlocks(
                    rulesList: rulesForGroup,
                    groupRules: &groupRules,
                    rulesByAffinityBlocks: &rulesByAffinityBlocks
                )
            }

            let userRulesList = preparedFilters.userRulesList
            if !userRulesList.isEmpty {
                self.sortWithAffinityBlocks(
                    rulesList: userRulesList,
                    groupRules: &groupRules,
                    rulesByAffinityBlocks: &rulesByAffinityBlocks
                )
            }

            rulesByGroup[group] = groupRules
        }

        for group in groups {
            if rulesByAffinityBlocks[group] != nil,
               var concreteGroup = rulesByGroup[group],
               let affinityBlocks = rulesByAffinityBlocks[group] {
                concreteGroup.append(contentsOf: affinityBlocks)
                rulesByGroup[group] = concreteGroup
            }

            if let concreteList = rulesByGroup[group] {
                let uniqueRules = OrderedSet(concreteList)
                result.append(
                    GroupedRules(
                        key: group,
                        rules: Array(uniqueRules)
                    )
                )
            }
        }

        return result
    }

    /// Get enabled filters names divided by Safari blocker type
    func groupFilters(filters: [ActiveFilterInfo]) -> [SafariBlockerType: [Int]] {
        var result: [SafariBlockerType: [Int]] = [:]

        var filtersGroupedByGroup: [Int: [Int]] = [:]

        for filter in filters {
            let filterId = filter.filterId
            let groupId = filter.groupId
            if filtersGroupedByGroup[groupId] != nil {
                filtersGroupedByGroup[groupId]?.append(filterId)
            } else {
                filtersGroupedByGroup[groupId] = [filterId]
            }
        }

        for blocker in SafariBlockerType.allCases {
            var names: [Int] = []
            blocker.filtersGroups.forEach { filterGroup in
                names.append(contentsOf: filtersGroupedByGroup[filterGroup.id] ?? [])
            }
            result[blocker] = names
        }
        return result
    }

    /// Extract affinity blocks
    private func sortWithAffinityBlocks(
        rulesList: [String],
        groupRules: inout [String],
        rulesByAffinityBlocks: inout [SafariBlockerType: [String]]
    ) {
        var currentBlockGroups: [SafariBlockerType] = []
        for rule in rulesList where !rule.isEmpty {
            if rule.starts(with: affinityDirectiveStart) {
                currentBlockGroups = self.parseGroupsByAffinity(ruleText: rule)
            } else if rule.starts(with: affinityDirective) {
                currentBlockGroups.removeAll(keepingCapacity: true)
            } else if !currentBlockGroups.isEmpty {
                for group in currentBlockGroups {
                    var availableRules = rulesByAffinityBlocks[group] ?? []
                    availableRules.append(rule)
                    rulesByAffinityBlocks[group] = availableRules
                }
            } else {
                groupRules.append(rule)
            }
        }
    }

    private func parseGroupsByAffinity(ruleText: String) -> [SafariBlockerType] {
        var groupsMapping: [SafariBlockerType] = []

        let startIndex = affinityDirective.count + 1
        let stripped = ruleText[startIndex..<ruleText.count - 1]
        for affinityBlock in stripped.split(separator: ",") {
            let block = affinityBlock.trimmingCharacters(in: .whitespacesAndNewlines)
            if let key = AffinityKey(rawValue: block) {
                groupsMapping.append(contentsOf: key.blockerGroups)
            }
        }

        return groupsMapping
    }
}
