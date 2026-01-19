// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { NotificationContext, NotificationsQueueVariant } from 'SettingsStore/modules';
import { Button, Text } from 'UILib';

import s from './NotificationsRenderer.module.pcss';

import type { NotificationPropsHolder } from 'SettingsLib/utils/NotificationPropsHolder';
import type { NotificationPropertiesSelector } from 'SettingsStore/modules';

type Props = {  
    notification: NotificationPropsHolder<NotificationPropertiesSelector>;
    onCloseNotification(): void;
};

const buttonProps = {
    [NotificationsQueueVariant.buttonAccent]: {
        type: 'outlined',
        size: 'medium',
    },
    [NotificationsQueueVariant.textOnly]: {
        type: 'text',
        size: 'regular',
    },
} as const;

/**
 * Switch for rendering right button component, based on notification context
 *
 * @param notification
 * @param platformType
 * @param onCloseNotification
 */
export function NotificationButtonSwitch({
    notification,
    onCloseNotification,
}: Props) {
    const { notificationContext } = notification.props;
    let content;

    switch (notificationContext) {
        case NotificationContext.ctaButton: {
            const { onClick, btnLabel, variant } = notification.props;

            content = (
                <Button
                    onClick={onClick}
                    {...buttonProps[variant]}
                >
                    <Text type="t1">{btnLabel}</Text>
                </Button>
            );
            break;
        }

        case NotificationContext.info: {
            const { undoAction } = notification.props;

            if (undoAction) {
                content = (
                    <Button
                        type="text"
                        onClick={() => {
                            undoAction();
                            onCloseNotification();
                        }}
                    >
                        <Text type="t1">{translate('undo')}</Text>
                    </Button>
                );
            }

            break;
        }
    }

    return content ? <div className={s.NotificationButtonSwitch_btn}>{content}</div> : null;
}
