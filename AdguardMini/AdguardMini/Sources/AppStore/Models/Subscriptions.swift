// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Subscriptions.swift
//  AdguardMini
//

import Foundation
import StoreKit

import AppStore

extension AppStore {
    enum Subscription: String, CaseIterable, StoreSubscription {
        case monthly = "com.adguard.safari.AdGuard.monthly.01"
        case annual = "com.adguard.safari.AdGuard.annual.01"

        var productId: String {
            self.rawValue
        }
    }
}
