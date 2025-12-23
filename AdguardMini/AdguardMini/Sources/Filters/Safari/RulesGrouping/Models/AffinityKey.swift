// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AffinityKey.swift
//  AdguardMini
//

import Foundation

/// Affinity keys list.
///
/// Defines Safari content blockers affinity for the rules.
///
/// More info: `https://github.com/AdguardTeam/AdguardForiOS/issues/1104`
enum AffinityKey: String {
    case general
    case privacy
    case security
    case socialWidgetsAndAnnoyances
    case other
    case custom
    case all
}
