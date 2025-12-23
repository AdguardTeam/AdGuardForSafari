// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LegacyMapper.swift
//  AdguardMini
//

import Foundation

import AML
import FLM

// MARK: - Constants

private enum Constants {
    /// ID of the old large annoyance filter, which was divided into 5 constituent filters.
    static var legacyAnnoyancesFilterId: Int { 14 }

    static var adguardBaseFilterId: Int { 2 }
    static var adguardMobileAdsFilterId: Int { 11 }

    static var indexFiltersDiapason: ClosedRange<Int> = 1...999
}

// MARK: - LegacyMapper

protocol LegacyMapper {
    func indexFilters(filters: [Int: Bool]) -> LegacyMapperResult
    func userRules(config: Legacy.UserRulesConfig?) -> (enabled: Bool, rules: [FilterRule])
}

struct LegacyMapperResult {
    let haveFilters: Bool
    let enabledIds: [Int]
    let disabledIds: [Int]

    static var empty: Self {
        .init(haveFilters: false, enabledIds: [], disabledIds: [])
    }
}

extension Legacy {
    final class Mapper: LegacyMapper {
        private let ruleBuilder: AllowBlockListRuleBuilder

        init(ruleBuilder: AllowBlockListRuleBuilder) {
            self.ruleBuilder = ruleBuilder
        }

        func indexFilters(filters: [Int: Bool]) -> LegacyMapperResult {
            guard !filters.isEmpty else {
                LogWarn("No state for filters")
                return .empty
            }

            let indexFilters = filters.filter { Constants.indexFiltersDiapason.contains($0.key) }

            guard !indexFilters.isEmpty else {
                LogWarn("No index filters")
                return .empty
            }

            var enabled = Set<Int>()
            var disabled = Set<Int>()
            var annoyancesToEnable = Set<Int>()

            let legacyAnnoyancesId = Constants.legacyAnnoyancesFilterId

            // 1) Disable legacy annoyances filter and enable all parts of it if need it
            if let legacy = indexFilters[legacyAnnoyancesId] {
                disabled.insert(legacyAnnoyancesId)
                if legacy {
                    annoyancesToEnable = Set(AdGuardAnnoyancesFilterId.allIds)
                }
            }

            // 2) Process all filters normally (exclude only the legacy container)
            for (filterId, isEnabled) in indexFilters where filterId != legacyAnnoyancesId {
                if isEnabled { enabled.insert(filterId) } else { disabled.insert(filterId) }
            }

            // 4) Apply annoyances expansion
            if !annoyancesToEnable.isEmpty {
                enabled.formUnion(annoyancesToEnable)
                disabled.subtract(annoyancesToEnable)
            }

            // Final cleanup: no overlaps
            let overlap = enabled.intersection(disabled)
            if !overlap.isEmpty {
                LogWarn("Conflict: IDs both enabled and disabled: \(overlap.sorted()) — keeping enabled")
                disabled.subtract(overlap)
            }

            return LegacyMapperResult(
                haveFilters: true,
                enabledIds: Array(enabled),
                disabledIds: Array(disabled)
            )
        }

        func userRules(config: UserRulesConfig?) -> (enabled: Bool, rules: [FilterRule]) {
            func createRules(basics: [String], isEnabled: Bool, creator: (String) -> String) -> [FilterRule] {
                basics.map {
                    FilterRule(
                        ruleText: creator($0),
                        isEnabled: isEnabled
                    )
                }
            }

            var rules: [FilterRule] = []
            let isUserRulesEnabled = config?.enabled ?? true

            let isAllowlistEnabled = config?.allowlistEnabled ?? true
            let isAllowMode = config?.defaultAllowlistMode ?? true

            if let blockListDomains = config?.blockListDomains {
                let isEnabled = isAllowlistEnabled && !isAllowMode
                let newRule = FilterRule(
                    ruleText: self.ruleBuilder.invertedAllowlistRule(for: blockListDomains),
                    isEnabled: isEnabled
                )
                rules.append(newRule)
            }

            if let allowListDomains = config?.whiteListDomains {
                let isEnabled = isAllowlistEnabled && isAllowMode
                let newRules = createRules(
                    basics: allowListDomains,
                    isEnabled: isEnabled,
                    creator: self.ruleBuilder.basicAllowlistRule(for:)
                )
                rules.append(contentsOf: newRules)
            }

            if let userRules = config?.userFilterRules {
                let newRules = createRules(
                    basics: userRules,
                    isEnabled: isUserRulesEnabled || !(isAllowlistEnabled),
                    creator: String.init(stringLiteral:)
                )
                rules.append(contentsOf: newRules)
            }

            return (isUserRulesEnabled || isAllowlistEnabled, rules)
        }
    }
}
