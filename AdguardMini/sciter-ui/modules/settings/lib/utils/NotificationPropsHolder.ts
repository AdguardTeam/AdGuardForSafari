// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import type { NotificationPropertiesSelector } from 'SettingsStore/modules/NotificationsQueue';

/**
 * NotificationPropsHolder object for NotificationsQueue
 */
export class NotificationPropsHolder {
    /**
     * Ctor
     */
    constructor(public readonly props: NotificationPropertiesSelector) {}
}
