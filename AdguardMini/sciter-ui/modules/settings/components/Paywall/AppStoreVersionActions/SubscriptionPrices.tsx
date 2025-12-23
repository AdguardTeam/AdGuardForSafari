// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { AppStoreSubscription } from 'Apis/types';
import { Button, Text, Icon } from 'UILib';

import s from './SubscriptionPrices.module.pcss';

import type { AppStoreSubscriptions } from 'Apis/types';

type SubscriptionPricesProps = {
    appStoreSubscriptions: AppStoreSubscriptions | undefined;
    currentSelectedPlan: AppStoreSubscription;
    setCurrentSelectedPlan(plan: AppStoreSubscription): void;
};

/**
 * Subscription prices select for AppStoreVersionActions component
 */
export function SubscriptionPrices({
    appStoreSubscriptions,
    currentSelectedPlan,
    setCurrentSelectedPlan,
}: SubscriptionPricesProps) {
    const { annual, monthly, promoInfo } = appStoreSubscriptions || {};

    const isPromoAvailable = !!promoInfo;

    return (
        <>
            <Button
                div={!!(isPromoAvailable && annual?.introOfferDisplayPrice)}
                className={cx(
                    s.SubscriptionPrices_btn,
                    currentSelectedPlan === AppStoreSubscription.annual && s.SubscriptionPrices_btn__active,
                )}
                type="outlined"
                onClick={() => setCurrentSelectedPlan(AppStoreSubscription.annual)}
            >
                <Text lineHeight="none" type="t1" className={s.SubscriptionPrices_btn_text}>
                    {(isPromoAvailable && annual?.introOfferDisplayPrice) ? 
                        translate('settings.paywall.plan.with.discount', {
                            standard: (text: string) => <span className={s.SubscriptionPrices_offer}>{text}</span>,
                            price: annual?.displayPrice,
                            withDiscount: annual?.introOfferDisplayPrice,
                        })
                        : translate('settings.paywall.payment.plan.yearly', {
                            currencyAndPrice: annual?.displayPrice,
                        })
                    }
                </Text>
                <Icon className={s.SubscriptionPrices_btn_icon} icon="check" />
            </Button>
            <Button
                div={!!(isPromoAvailable && monthly?.introOfferDisplayPrice)}
                className={cx(
                    s.SubscriptionPrices_btn,
                    currentSelectedPlan === AppStoreSubscription.monthly && s.SubscriptionPrices_btn__active,
                )}
                type="outlined"
                onClick={() => setCurrentSelectedPlan(AppStoreSubscription.monthly)}
            >
                <Text lineHeight="none" type="t1" className={s.SubscriptionPrices_btn_text}>
                    {isPromoAvailable && monthly?.introOfferDisplayPrice ? 
                        translate('settings.paywall.plan.with.discount.month', {
                            standard: (text: string) => <span className={s.SubscriptionPrices_offer}>{text}</span>,
                            price: monthly?.displayPrice,
                            withDiscount: monthly?.introOfferDisplayPrice,
                        })
                        : translate('settings.paywall.payment.plan.monthly', {
                            currencyAndPrice: monthly?.displayPrice,
                        })}
                </Text>
                <Icon className={s.SubscriptionPrices_btn_icon} icon="check" />
            </Button>
        </>
    );
}
