// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UrlFilteringChecker.swift
//  AdguardMini
//

import Foundation
import AML

// MARK: - UrlFilteringChecker

protocol UrlFilteringChecker {
    func basicAllowlistRule(for domain: String) -> String
    func isHostInAllowList(_ host: String, by rules: [String]) -> Bool
}

// MARK: - UrlFilteringCheckerImpl

final class UrlFilteringCheckerImpl: UrlFilteringChecker {
    private let urlBuilder: AllowBlockListRuleBuilder

    init(urlBuilder: AllowBlockListRuleBuilder) {
        self.urlBuilder = urlBuilder
    }

    func basicAllowlistRule(for domain: String) -> String {
        self.urlBuilder.basicAllowlistRule(for: domain)
    }

    func isHostInAllowList(_ host: String, by rules: [String]) -> Bool {
        guard !self.checkIsHostInAllowList(host, by: rules) else { return true }

        return if host.contains(self.urlBuilder.wwwSubdomain) {
            self.checkIsHostInAllowList(
                host.replacingOccurrences(of: self.urlBuilder.wwwSubdomain, with: ""), by: rules
            )
        } else {
            self.checkIsHostInAllowList(self.urlBuilder.wwwSubdomain.appending(host), by: rules)
        }
    }

    func checkIsHostInAllowList(_ host: String, by rules: [String]) -> Bool {
        let allowlistRule = self.basicAllowlistRule(for: "\(host)")
        for rule in rules {
            if rule.prefix(allowlistRule.count) == allowlistRule ||
               self.isHostNotFiltered(host, rule: rule) {
                return true
            }
        }
        return false
    }

    private func isHostNotFiltered(_ host: String, rule: String) -> Bool {
        let prefix = self.urlBuilder.allowlistRulePrefix(for: host)
        guard rule.prefix(prefix.count) == prefix else {
            return false
        }
        let components = rule.components(separatedBy: self.urlBuilder.separator)
        guard components.count > 1 else {
            return false
        }
        let modifiers = Set(components[1].components(separatedBy: ","))
        return self.urlBuilder.modifiers.isSubset(of: modifiers)
    }
}
