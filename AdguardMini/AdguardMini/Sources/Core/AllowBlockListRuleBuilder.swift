// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AllowBlockListRuleBuilder.swift
//  AdguardMini
//

import Foundation

// MARK: - AllowBlockListRuleBuilder

protocol AllowBlockListRuleBuilder {
    var wwwSubdomain: String { get }
    var separator: String { get }
    var modifiers: Set<String> { get }

    func allowlistRulePrefix(for domain: String) -> String
    func basicAllowlistRule(for domain: String) -> String
    func basicBlocklistRule(for domain: String) -> String
    func invertedAllowlistRule(for domains: [String]) -> String
}

// MARK: - AllowBlockListRuleBuilderImpl

final class AllowBlockListRuleBuilderImpl: AllowBlockListRuleBuilder {
    let wwwSubdomain = "www."
    let separator = "^$"
    let modifiers = Set(["important", "document"])

    func basicAllowlistRule(for domain: String) -> String {
        "\(self.allowlistRulePrefix(for: domain))\(self.modifiers.joined(separator: ","))"
    }

    func allowlistRulePrefix(for domain: String) -> String {
        "@@||\(domain)\(self.separator)"
    }

    func basicBlocklistRule(for domain: String) -> String {
        "\(self.blocklistRulePrefix(for: domain))\(self.modifiers.joined(separator: ","))"
    }

    func blocklistRulePrefix(for domain: String) -> String {
        "||\(domain)\(self.separator)"
    }

    func invertedAllowlistRule(for domains: [String]) -> String {
        let baseRule = "@@||*$document"

        guard !domains.isEmpty else {
            return baseRule
        }

        let formattedDomains = domains.map { "~\($0)" }
                                      .joined(separator: "|")

        return "\(baseRule),domain=\(formattedDomains)"
    }
}
