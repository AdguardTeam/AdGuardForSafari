// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariConversionResult.swift
//  AdguardMini
//

import Foundation
import ContentBlockerConverter

struct SafariConversionResult {
    let blockerType: SafariBlockerType
    let conversionInfo: Result<ConversionInfo, BlockerConversionError>

    static func cancelled(blockerType: SafariBlockerType) -> Self {
        .init(blockerType: blockerType, conversionInfo: .failure(.cancelled))
    }
}

struct ConversionInfo: Codable, Equatable, CustomStringConvertible, CustomDebugStringConvertible {
    /// Total number of AdGuard rules before the conversion started.
    let sourceRulesCount: Int

    /// The number of source AdGuard rules before attempting to convert them
    /// to Safari content blocking syntax. This number does not include advanced
    /// rules which are counted separately.
    let sourceSafariCompatibleRulesCount: Int

    /// The number of Safari rules in `safariRulesJSON`.
    let safariRulesCount: Int

    /// The number of advanced rules in `advancedRulesText`.
    let advancedRulesCount: Int

    /// The number of Safari rules that were discarded due to the limits that are imposed by the OS or Safari.
    ///
    /// There are two possible reasons for discarding rules:
    /// - Maximum number of rules in a content blocker (depends on the OS version, can be 50k or 150k)
    /// - Maximum size of the JSON file (the issue is specific to iOS versions, see FB13282146)
    let discardedSafariRules: Int

    /// AdGuard rules that need to be interpreted by web extension (or app extension).
    let advancedRulesText: String?

    /// Count of conversion errors (i.e. count of rules that we could not convert).
    let errorsCount: Int

    var overLimit: Bool {
        self.discardedSafariRules > 0
    }

    var description: String {
        self.debugDescription
    }

    var debugDescription: String {
        "ConversionInfo(sourceRulesCount: \(self.sourceRulesCount), sourceSafariCompatibleRulesCount: \(self.sourceSafariCompatibleRulesCount), safariRulesCount: \(self.safariRulesCount), advancedRulesCount: \(self.advancedRulesCount), discardedSafariRules: \(self.discardedSafariRules), advancedRulesTextLength: \(self.advancedRulesText?.count ?? 0)"
    }
}

extension ConversionInfo {
    static var empty: Self {
        .init(
            sourceRulesCount: 0,
            sourceSafariCompatibleRulesCount: 0,
            safariRulesCount: 0,
            advancedRulesCount: 0,
            discardedSafariRules: 0,
            advancedRulesText: nil,
            errorsCount: 0
        )
    }

    static var invalid: Self {
        .init(
            sourceRulesCount: -1,
            sourceSafariCompatibleRulesCount: -1,
            safariRulesCount: -1,
            advancedRulesCount: -1,
            discardedSafariRules: -1,
            advancedRulesText: nil,
            errorsCount: -1
        )
    }
}

extension ConversionResult {
    var conversionInfo: ConversionInfo {
        .init(
            sourceRulesCount: self.sourceRulesCount,
            sourceSafariCompatibleRulesCount: self.sourceSafariCompatibleRulesCount,
            safariRulesCount: self.safariRulesCount,
            advancedRulesCount: self.advancedRulesCount,
            discardedSafariRules: self.discardedSafariRules,
            advancedRulesText: self.advancedRulesText,
            errorsCount: self.errorsCount
        )
    }
}
