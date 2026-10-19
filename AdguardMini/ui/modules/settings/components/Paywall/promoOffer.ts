// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import type { PromoInfo } from 'Apis/types';

/**
 * Inputs deciding whether the promo offer card is shown on the paywall.
 */
type PromoOfferVisibility = {
    /** Promo copy sent by the backend, absent while no promo is running. */
    offer?: PromoInfo;
    /** Whether a subscription carries an intro (discounted) price. */
    hasIntroOfferPrice: boolean;
    /** Whether the build is the standalone variant, which has no App Store prices. */
    isStandaloneReleaseVariant: boolean;
    /** The user closed the card during this paywall session. */
    isDismissed: boolean;
};

/**
 * Resolves the promo offer to render on the paywall.
 *
 * The card advertises the discounted plan, so it needs promo copy and an intro
 * price to advertise — except in a standalone build, which has no App Store
 * intro price and shows the card on the promo copy alone. A release variant the
 * platform has not reported yet keeps the intro-price gate, so the card cannot
 * appear before the variant is known. The card stays dismissed for the rest of
 * the paywall session once the user closes it.
 *
 * @param params - Offer payload and the conditions around showing it
 * @returns The offer to render, or `undefined` when the card must stay hidden
 */
export function visiblePromoOffer({
    offer,
    hasIntroOfferPrice,
    isStandaloneReleaseVariant,
    isDismissed,
}: PromoOfferVisibility): PromoInfo | undefined {
    const requiresIntroOfferPrice = !isStandaloneReleaseVariant;

    if (!offer || (requiresIntroOfferPrice && !hasIntroOfferPrice) || isDismissed) {
        return undefined;
    }

    return offer;
}
