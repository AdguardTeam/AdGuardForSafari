// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';

import { useSettingsStore } from 'SettingsLib/hooks';
import { NotificationContext, NotificationsQueueIconType, NotificationsQueueType } from 'SettingsStore/modules';
import theme from 'Theme';
import { Modal } from 'UILib';

type ResetLicenseModalProps = {
    onClose(): void;
};

/**
 * Reset license modal for License screen
 */
function ResetLicenseModalComponent({
    onClose,
}: ResetLicenseModalProps) {
    const { account, notification } = useSettingsStore();

    const handleResetLicense = async () => {
        onClose();
        await account.requestLogout();
        notification.notify({
            message: translate('license.reset.notify'),
            notificationContext: NotificationContext.info,
            type: NotificationsQueueType.success,
            iconType: NotificationsQueueIconType.done,
            closeable: true,
        });
    };

    return (
        <Modal
            cancelText={translate('cancel')}
            description={translate('license.reset.modal.desc')}
            submitAction={handleResetLicense}
            submitClassName={theme.button.redSubmit}
            submitText={translate('reset')}
            title={translate('license.reset.modal.title')}
            cancel
            submit
            onClose={onClose}
        />
    );
}

export const ResetLicenseModal = observer(ResetLicenseModalComponent);
