// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { NotificationsQueueIconType as NQIconType, NotificationsQueueType } from 'SettingsStore/modules';
import { Icon } from 'UILib';

import s from './NotificationsRenderer.module.pcss';

import type { NotificationPropsHolder } from 'SettingsLib/utils/NotificationPropsHolder';
import type { IconType } from 'UILib';

type Props = {
    notification: NotificationPropsHolder;
};

/**
 * Render notification icon
 *
 * @param notification
 */
export function NotificationIcon({
    notification,
}: Props) {
    const { type, iconType } = notification.props;

    let color: string; // Colors;
    let icon: IconType; // Icon;
    let customClassName = '';

    switch (type) {
        case NotificationsQueueType.success:
            color = s.NotificationIcon__green;
            break;
        case NotificationsQueueType.warning:
            color = s.NotificationIcon__orange;
            break;
        case NotificationsQueueType.danger:
            color = s.NotificationIcon__red;
            break;
    }

    switch (iconType) {
        case NQIconType.done: {
            icon = 'logo_check';
            break;
        }
        case NQIconType.delete: {
            icon = 'trash';
            break;
        }
        case NQIconType.loading: {
            icon = 'loading';
            customClassName = s.NotificationIcon__loader;
            break;
        }
        default: {
            icon = 'info';
        }
    }

    return <Icon className={cx(color, customClassName)} icon={icon} />;
}
