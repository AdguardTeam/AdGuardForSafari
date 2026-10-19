// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariConverterUserRulesTests.swift
//  AdguardMiniTests
//

import XCTest

import ContentBlockerConverter

/// Tests for `SafariUserRulesDistributor` — the production helper that
/// distributes user rules and service groups across Safari content blockers.
/// `@MainActor` because the code under test is main-actor isolated.
@MainActor
final class SafariConverterUserRulesTests: XCTestCase {
    /// User rules without affinity must reach every content blocker.
    func testUserRulesWithoutAffinityDistributedToAllBlockers() {
        let userRules = [
            "@@||example.com^$important,document",
            "||blocked.com^"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        for type in ContentBlockerType.allCases {
            let rules = result[type] ?? []
            XCTAssertTrue(
                rules.contains("@@||example.com^$important,document"),
                "Rule should be in \(type)"
            )
            XCTAssertTrue(
                rules.contains("||blocked.com^"),
                "Rule should be in \(type)"
            )
        }
    }

    /// A rule scoped with `!#safari_cb_affinity(general)` must land only in
    /// `.general`, while a rule without affinity reaches all blockers.
    func testUserRulesWithAffinityScopedCorrectly() {
        let userRules = [
            "@@||no-affinity.com^",
            "!#safari_cb_affinity(general)",
            "@@||general-only.com^",
            "!#safari_cb_affinity"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        for type in ContentBlockerType.allCases {
            let rules = result[type] ?? []
            XCTAssertTrue(
                rules.contains("@@||no-affinity.com^"),
                "No-affinity rule should be in \(type)"
            )
        }

        XCTAssertTrue(
            result[.general]?.contains("@@||general-only.com^") ?? false,
            "Affinity rule should be in .general"
        )
        for type in ContentBlockerType.allCases where type != .general {
            XCTAssertFalse(
                result[type]?.contains("@@||general-only.com^") ?? false,
                "Affinity rule should NOT be in \(type)"
            )
        }
    }

    /// `!#safari_cb_affinity(all)` must reach every content blocker.
    func testAffinityAllDistributedToAllBlockers() {
        let userRules = [
            "!#safari_cb_affinity(all)",
            "||all-affinity.com^",
            "!#safari_cb_affinity"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        for type in ContentBlockerType.allCases {
            XCTAssertTrue(
                result[type]?.contains("||all-affinity.com^") ?? false,
                "Affinity(all) rule should be in \(type)"
            )
        }
    }

    /// Empty user rules must add nothing for any content blocker.
    func testEmptyUserRulesNoEffect() {
        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: [],
            serviceGroups: []
        )

        for type in ContentBlockerType.allCases {
            XCTAssertTrue(
                result[type]?.isEmpty ?? true,
                "Blocker \(type) should have no rules"
            )
        }
    }

    /// A rule present both in filter rules for `.other` and in user rules must
    /// appear exactly once in `.other` after deduplication.
    func testDuplicateRuleInFilterAndUserRulesDeduplicatedInOther() {
        let sharedRule = "||shared.com^"
        let filterRules: [(ContentBlockerType, [String])] = [
            (.other, [sharedRule, "||filter-only.com^"])
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: filterRules,
            userRules: [sharedRule],
            serviceGroups: []
        )

        let otherRules = result[.other] ?? []
        XCTAssertEqual(
            otherRules.filter { $0 == sharedRule }.count,
            1,
            "Shared rule must appear exactly once in .other"
        )
        XCTAssertTrue(
            otherRules.contains("||filter-only.com^"),
            "Filter-only rule must remain in .other"
        )
    }

    /// Non-empty service groups must be placed in `.other` ahead of user rules.
    func testServiceGroupsAddedToOtherBeforeUserRules() {
        let serviceRule = "||service.com^"
        let userRule = "||user.com^"

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: [userRule],
            serviceGroups: [serviceRule]
        )

        let otherRules = result[.other] ?? []
        guard
            let serviceIndex = otherRules.firstIndex(of: serviceRule),
            let userIndex = otherRules.firstIndex(of: userRule)
        else {
            XCTFail("Both service and user rules must be in .other")
            return
        }
        XCTAssertLessThan(
            serviceIndex,
            userIndex,
            "Service group rule must come before the user rule in .other"
        )
    }

    /// Mixed input (affinity + no-affinity + duplicates + service groups) must
    /// distribute correctly and deduplicate within every blocker.
    func testMixedAffinityAndDuplicatesDistribution() {
        let userRules = [
            "||no-affinity.com^",
            "||no-affinity.com^",
            "!#safari_cb_affinity(privacy)",
            "||privacy-only.com^",
            "!#safari_cb_affinity"
        ]
        let serviceGroups = ["||service.com^"]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [(.other, ["||filter-other.com^"])],
            userRules: userRules,
            serviceGroups: serviceGroups
        )

        // No-affinity rule reaches all blockers, deduplicated to one entry.
        for type in ContentBlockerType.allCases {
            let rules = result[type] ?? []
            XCTAssertEqual(
                rules.filter { $0 == "||no-affinity.com^" }.count,
                1,
                "No-affinity rule must appear exactly once in \(type)"
            )
        }

        // Privacy-scoped rule is only in .privacy.
        XCTAssertTrue(
            result[.privacy]?.contains("||privacy-only.com^") ?? false,
            "Privacy rule should be in .privacy"
        )
        for type in ContentBlockerType.allCases where type != .privacy {
            XCTAssertFalse(
                result[type]?.contains("||privacy-only.com^") ?? false,
                "Privacy rule should NOT be in \(type)"
            )
        }

        // Service group and filter rule stay in .other.
        XCTAssertTrue(
            result[.other]?.contains("||service.com^") ?? false,
            "Service rule should be in .other"
        )
        XCTAssertTrue(
            result[.other]?.contains("||filter-other.com^") ?? false,
            "Filter rule should be in .other"
        )
    }

    /// An unknown / misspelled affinity keyword is silently ignored by the
    /// grouper, so the affected rule falls back to every content blocker
    /// instead of being dropped. This documents the silent fallback behavior.
    func testUnknownAffinityKeywordFallsBackToAllBlockers() {
        let userRules = [
            "!#safari_cb_affinity(unknown)",
            "||typo-affinity.com^",
            "!#safari_cb_affinity"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        for type in ContentBlockerType.allCases {
            XCTAssertTrue(
                result[type]?.contains("||typo-affinity.com^") ?? false,
                "Unknown-affinity rule should fall back to \(type)"
            )
        }
    }

    /// A comma-separated affinity list must route the rule to exactly the
    /// listed content blockers and to none of the others.
    func testCommaSeparatedAffinityScopedToListedBlockers() {
        let userRules = [
            "!#safari_cb_affinity(general,privacy)",
            "||multi-affinity.com^",
            "!#safari_cb_affinity"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        let scoped: Set<ContentBlockerType> = [.general, .privacy]
        for type in ContentBlockerType.allCases {
            let contains = result[type]?.contains("||multi-affinity.com^") ?? false
            if scoped.contains(type) {
                XCTAssertTrue(contains, "Rule should be in \(type)")
            } else {
                XCTAssertFalse(contains, "Rule should NOT be in \(type)")
            }
        }
    }

    /// The `social` affinity keyword maps to the
    /// `.socialWidgetsAndAnnoyances` content blocker despite the name
    /// mismatch between the directive keyword and the enum case.
    func testSocialAffinityMapsToSocialWidgetsBlocker() {
        let userRules = [
            "!#safari_cb_affinity(social)",
            "||social-only.com^",
            "!#safari_cb_affinity"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        XCTAssertTrue(
            result[.socialWidgetsAndAnnoyances]?.contains("||social-only.com^") ?? false,
            "Social rule should be in .socialWidgetsAndAnnoyances"
        )
        for type in ContentBlockerType.allCases where type != .socialWidgetsAndAnnoyances {
            XCTAssertFalse(
                result[type]?.contains("||social-only.com^") ?? false,
                "Social rule should NOT be in \(type)"
            )
        }
    }

    /// An affinity directive that is opened but never closed keeps scoping
    /// every subsequent user rule, so all of them land only in the opened
    /// blocker. This documents the missing-terminator footgun.
    func testUnclosedAffinityScopesAllSubsequentRules() {
        let userRules = [
            "!#safari_cb_affinity(general)",
            "||first.com^",
            "||second.com^"
        ]

        let result = SafariUserRulesDistributor.distribute(
            filterRules: [],
            userRules: userRules,
            serviceGroups: []
        )

        XCTAssertTrue(
            result[.general]?.contains("||first.com^") ?? false,
            "First rule should be in .general"
        )
        XCTAssertTrue(
            result[.general]?.contains("||second.com^") ?? false,
            "Second rule should also be scoped to .general"
        )
        for type in ContentBlockerType.allCases where type != .general {
            XCTAssertFalse(
                result[type]?.contains("||first.com^") ?? false,
                "First rule should NOT leak into \(type)"
            )
            XCTAssertFalse(
                result[type]?.contains("||second.com^") ?? false,
                "Second rule should NOT leak into \(type)"
            )
        }
    }

    /// Within `.other`, deduplicated rules must keep the source order:
    /// filter rules first, then service groups, then user rules.
    func testOtherPreservesFilterServiceUserOrder() {
        let result = SafariUserRulesDistributor.distribute(
            filterRules: [(.other, ["||filter.com^"])],
            userRules: ["||user.com^"],
            serviceGroups: ["||service.com^"]
        )

        XCTAssertEqual(
            result[.other],
            ["||filter.com^", "||service.com^", "||user.com^"],
            "Order in .other must be filter -> service -> user"
        )
    }

    /// Multiple filter-rule tuples targeting the same content blocker must be
    /// merged and deduplicated while preserving first-seen order.
    func testMultipleFilterTuplesForSameTypeMergedAndDeduplicated() {
        let result = SafariUserRulesDistributor.distribute(
            filterRules: [
                (.general, ["||x.com^", "||y.com^"]),
                (.general, ["||y.com^", "||z.com^"])
            ],
            userRules: [],
            serviceGroups: []
        )

        XCTAssertEqual(
            result[.general],
            ["||x.com^", "||y.com^", "||z.com^"],
            "Same-type filter tuples must merge, dedup, and keep order"
        )
    }
}
