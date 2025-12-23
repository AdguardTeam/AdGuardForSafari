// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesCallbackState+Utils.swift
//  SciterSchema
//

import Foundation
import BaseSciterSchema

extension UserRulesCallbackState {
    public init (rules: [UserRule] = []) {
        self.init()
        self.rules = rules
    }
}
