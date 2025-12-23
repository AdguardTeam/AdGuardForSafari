// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRule+Init.swift
//  SciterSchema
//

import BaseSciterSchema

extension UserRule {
    public init(rule: String, enabled: Bool) {
        self.init()
        self.rule = rule
        self.enabled = enabled
    }
}
