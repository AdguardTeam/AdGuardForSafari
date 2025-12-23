// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect } from 'preact/hooks';

import { NotificationContext, NotificationsQueueType, NotificationsQueueIconType, NotificationsQueueVariant } from 'TrayStore/modules';

import { useTrayStore } from './useTrayStore';

/**
 * Hook for showing notification to buy full version for more frequent updates
 */
export function useMoreFrequentUpdatesNotify() {
    const { settings, notification } = useTrayStore();

    const { isLicenseOrTrialActive, license } = settings;

    useEffect(() => {
        if (!isLicenseOrTrialActive) {
            notification.notify({
                notificationContext: NotificationContext.ctaButton,
                message: translate('tray.frequent.updates'),
                type: NotificationsQueueType.success,
                iconType: NotificationsQueueIconType.loading,
                variant: NotificationsQueueVariant.textOnly,
                btnLabel: translate('buy'),
                timeout: false,
                closeable: true,
                onClick: settings.requestOpenPaywallScreen,
            }, true);
        }
    }, [license, isLicenseOrTrialActive, notification, settings.requestOpenPaywallScreen]);
}
