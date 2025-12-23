// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppStoreProductInfo.swift
//  AdguardMini
//

import Foundation
import StoreKit

struct AppStoreProductInfo {
    let productId: String

    let localizedTitle: String
    let localizedDescription: String

    let displayPrice: String

    let isEligibleForIntroOffer: Bool
    let subscriptionPeriod: Product.SubscriptionPeriod?
    let introductoryOffer: Product.SubscriptionOffer?
    let discounts: [Product.SubscriptionOffer]
}
