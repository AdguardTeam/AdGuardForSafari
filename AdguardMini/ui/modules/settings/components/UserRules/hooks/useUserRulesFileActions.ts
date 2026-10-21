// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { ShowInFinderRequest } from 'Apis/requests/InternalService';
import { getFormattedDateTime } from 'Common/utils/date';
import { notifyError, notifySuccess, notifySuccessCTA } from 'Common/utils/notifications';
import { dirname } from 'Common/utils/path';
import { selectFile } from 'Common/utils/selectFile';
import { useSettingsStore } from 'SettingsLib/hooks';
import { getNotificationSomethingWentWrongText, provideContactSupportParam } from 'SettingsLib/utils/translate';

/**
 * Import and export actions of the user-rules page.
 *
 * An import reports success only when the platform applied the rules, and
 * reports a failure both when the platform replies without rules and when the
 * request rejects.
 *
 * @returns The handlers the page binds to its title menu.
 */
export function useUserRulesFileActions() {
    const { notification, settings, userRules } = useSettingsStore();

    const showInFinder = (path: string) => {
        window.API.Execute(new ShowInFinderRequest({ path }));
    };

    const notifyImportFailed = () => {
        notifyError(notification, translate('notification.user.rules.import.failed', provideContactSupportParam({
            className: tx.color.linkGreen,
        })));
    };

    const onImportRules = async () => {
        try {
            const defaultPath = settings.userActionLastDirectory ?? '';
            await selectFile(false, '(*.txt)|*.txt', translate('import'), defaultPath, async (path: string) => {
                settings.updateUserActionLastDirectory(dirname(path));
                try {
                    const applied = await userRules.importUserRules(path);
                    if (!applied) {
                        notifyImportFailed();
                        return;
                    }
                } catch (importError) {
                    log.error(String(importError), 'onImportRules');
                    notifyImportFailed();
                    return;
                }
                notifySuccess(notification, translate('notification.user.rules.import'));
            });
        } catch (error) {
            log.error(String(error), 'onImportRules');
            notifyImportFailed();
        }
    };

    const onExportRules = async () => {
        try {
            const defaultPath = settings.userActionLastDirectory ?? '';
            await selectFile(true, '(*.txt)|*.txt', translate('export'), `${defaultPath}/adguard_mini_user_rules_${getFormattedDateTime()}`, async (path: string) => {
                settings.updateUserActionLastDirectory(dirname(path));
                try {
                    const error = await userRules.exportUserRules(path);
                    if (error) {
                        notifyError(notification, getNotificationSomethingWentWrongText());
                        return;
                    }
                } catch (exportError) {
                    log.error(String(exportError), 'onExportRules');
                    notifyError(notification, getNotificationSomethingWentWrongText());
                    return;
                }
                notifySuccessCTA(notification, translate('notification.user.rules.export'), {
                    onClick: () => { showInFinder(path); },
                    btnLabel: translate('notification.open.in.finder'),
                });
            });
        } catch (error) {
            log.error(String(error), 'onExportRules');
            notifyError(notification, getNotificationSomethingWentWrongText());
        }
    };

    return { onImportRules, onExportRules };
}
