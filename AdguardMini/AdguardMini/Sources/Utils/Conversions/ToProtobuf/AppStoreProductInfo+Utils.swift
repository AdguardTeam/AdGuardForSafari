// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppStoreProductInfo+Utils.swift
//  AdguardMini
//

import Foundation
import StoreKit

import SciterSchema

extension AppStoreProductInfo {
    func toProto(introOfferTitle: String? = nil, introOfferSubtitle: String? = nil) -> AppStoreSubscriptionInfo {
        let subscriptionType: AppStoreSubscription =
        self.productId == AppStore.Subscription.annual.rawValue
        ? .annual
        : .monthly

        var introOfferDisplayPrice: String?
        if let offer = self.introductoryOffer, offer.paymentMode != .freeTrial {
            introOfferDisplayPrice = offer.displayPrice
        }

        return AppStoreSubscriptionInfo(
            subscriptionType: subscriptionType,
            displayPrice: self.displayPrice,
            trialDays: Int32(self.introductoryOffer?.period.value ?? 0),
            introOfferDisplayPrice: introOfferDisplayPrice
        )
    }
}
