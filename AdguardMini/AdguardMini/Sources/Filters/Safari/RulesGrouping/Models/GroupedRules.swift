// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  GroupedRules.swift
//  AdguardMini
//

import Foundation

struct GroupedRules {
    let key: SafariBlockerType
    let rules: [String]
}
