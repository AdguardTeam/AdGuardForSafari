// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SKProduct+Utils.swift
//  AdguardMini
//

import StoreKit

extension Product {
    func toAppStoreProductInfo() async -> AppStoreProductInfo {
        AppStoreProductInfo(
            productId: self.id,
            localizedTitle: self.displayName,
            localizedDescription: self.description,
            displayPrice: self.displayPrice,
            isEligibleForIntroOffer: await self.subscription?.isEligibleForIntroOffer ?? false,
            subscriptionPeriod: self.subscription?.subscriptionPeriod,
            introductoryOffer: self.subscription?.introductoryOffer,
            discounts: self.subscription?.promotionalOffers ?? []
        )
    }
}
