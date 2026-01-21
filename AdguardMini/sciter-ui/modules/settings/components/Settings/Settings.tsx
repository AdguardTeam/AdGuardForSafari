// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'preact/hooks';

import { ImportMode, OptionalStringValue, Path } from 'Apis/types';
import { selectFile } from 'Common/utils/selectFile';
import { getCountableEntityStatuses } from 'Common/utils/utils';
import { usePayedFuncsTitle, useSettingsStore } from 'SettingsLib/hooks';
import { quitReactionText, getNotificationSettingsImportFailedText, getNotificationSomethingWentWrongText, themeText } from 'SettingsLib/utils/translate';
import { NotificationContext, NotificationsQueueIconType, NotificationsQueueType, NotificationsQueueVariant, RouteName, SettingsEvent } from 'SettingsStore/modules';
import theme from 'Theme';
import {
    Layout,
    Text,
    Modal,
    Button,
    ConsentModal,
    AppUsageDataModal,
} from 'UILib';
import { getFormattedDateTime } from 'Utils/date';

import { SettingsItemLink, SettingsItemSwitch } from '../SettingsItem';
import { SettingsTitle } from '../SettingsTitle';

import s from './Settings.module.pcss';

const SETTINGS_ARCHIVE_EXT = 'adguardminisettings';
const SETTINGS_ARCHIVE_FILTER = `(*.${SETTINGS_ARCHIVE_EXT})|*.${SETTINGS_ARCHIVE_EXT}`;
const LEGACY_SETTINGS_EXT = 'json';
const LEGACY_SETTINGS_FILTER = `(*.${LEGACY_SETTINGS_EXT})|*.${LEGACY_SETTINGS_EXT}`;

/**
 * Settings page in settings module
 */
export function SettingsComponent() {
    const {
        settings,
        filters: filtersStore,
        filters: { filters: { filters: storeFilters } },
        account: { isLicenseOrTrialActive },
        account,
        telemetry,
        notification } = useSettingsStore();
    const {
        settings: {
            launchOnStartup,
            showInMenuBar,
            hardwareAcceleration,
            autoFiltersUpdate,
            realTimeFiltersUpdate,
            debugLogging,
            allowTelemetry,
            quitReaction,
            theme: themeSetting,
        },
        userActionLastDirectory,
        incomeHardwareAcceleration,
        shouldGiveConsent,
    } = settings;

    const {
        allDisabled: allExtensionsDisabled,
        allEnabled: allExtensionsEnabled,
        someDisabled: someExtensionsDisabled,
    } = getCountableEntityStatuses(settings.enabledSafariExtensionsCount, settings.safariExtensionsCount);

    const [showResetModal, setShowResetModal] = useState(false);
    const [showHardwareModal, setShowHardwareModal] = useState(false);
    const [hardwareModalLoader, setHardwareModalLoader] = useState(false);
    const [showTelemetryModal, setShowTelemetryModal] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState<number[]>();

    const payedFuncsTitle = usePayedFuncsTitle(SettingsEvent.RealTimeUpdatesTryForFreeClick);

    useEffect(() => {
        if (shouldGiveConsent.length) {
            setShowConsentModal(shouldGiveConsent);
        } else {
            setShowConsentModal(undefined);
        }
    }, [shouldGiveConsent]);

    useEffect(() => {
        if (typeof incomeHardwareAcceleration === 'boolean') {
            setShowHardwareModal(true);
        }
    }, [incomeHardwareAcceleration]);

    const showInFinder = (path: string) => {
        window.API.internalService.ShowInFinder(new Path({ path }));
    };

    const onConsent = (mode: ImportMode) => {
        setShowConsentModal(undefined);
        settings.confirmImport(mode);
    };

    const onHardwareChange = () => {
        setShowHardwareModal(false);
        setHardwareModalLoader(true);
        if (typeof incomeHardwareAcceleration === 'boolean') {
            settings.restartAppToApplyHardwareAcceleration();
        } else {
            settings.updateHardwareAcceleration(!hardwareAcceleration);
        }
    };

    const onImport = () => {
        const defaultPath = userActionLastDirectory || window.DocumentsPath;
        try {
            selectFile(false, `${SETTINGS_ARCHIVE_FILTER}|${LEGACY_SETTINGS_FILTER}`, translate('import'), defaultPath, async (path: string) => {
                const pathParts = path.split('/');
                pathParts.pop();
                settings.updateUserActionLastDirectory(pathParts.join('/'));
                settings.importSettings(path);
            });
        } catch (error) {
            log.error(String(error), 'onImportRules');
            notification.notify({
                message: getNotificationSettingsImportFailedText(),
                notificationContext: NotificationContext.info,
                type: NotificationsQueueType.warning,
                iconType: NotificationsQueueIconType.error,
                closeable: true,
            });
        }
    };

    const onExport = async () => {
        const defaultPath = userActionLastDirectory || window.DocumentsPath;
        selectFile(true, `${SETTINGS_ARCHIVE_FILTER}`, translate('export'), `${defaultPath}/adguard_mini_${getFormattedDateTime()}`, async (path: string) => {
            settings.updateUserActionLastDirectory(path);
            const error = await settings.exportSettings(path);
            if (error.hasError) {
                notification.notify({
                    message: translate('notification.something.went.wrong'),
                    notificationContext: NotificationContext.info,
                    type: NotificationsQueueType.warning,
                    iconType: NotificationsQueueIconType.error,
                    closeable: true,
                });
            } else {
                notification.notify({
                    message: translate('notification.settings.export'),
                    notificationContext: NotificationContext.ctaButton,
                    type: NotificationsQueueType.success,
                    iconType: NotificationsQueueIconType.done,
                    closeable: true,
                    onClick: () => { showInFinder(path); },
                    btnLabel: translate('notification.open.in.finder'),
                    variant: NotificationsQueueVariant.textOnly,
                });
            }
        });
    };

    const onReset = () => {
        settings.resetSettings();
        notification.notify({
            message: translate('notification.settings.reset'),
            notificationContext: NotificationContext.info,
            type: NotificationsQueueType.success,
            iconType: NotificationsQueueIconType.done,
            closeable: true,
        });
        setShowResetModal(false);
        telemetry.trackEvent(SettingsEvent.ResetToDefaultClick);
    };

    const onExportLogs = () => {
        selectFile(true, '(*.zip)|*.zip', translate('export'), `${window.DocumentsPath}/adguard_mini_${getFormattedDateTime()}`, async (path: string) => {
            const error = await settings.exportLogs(path);
            if (error) {
                notification.notify({
                    message: getNotificationSomethingWentWrongText(),
                    notificationContext: NotificationContext.info,
                    type: NotificationsQueueType.warning,
                    iconType: NotificationsQueueIconType.error,
                    closeable: true,
                });
            } else {
                notification.notify({
                    message: translate('notification.settings.logs'),
                    notificationContext: NotificationContext.ctaButton,
                    type: NotificationsQueueType.success,
                    iconType: NotificationsQueueIconType.done,
                    closeable: true,
                    onClick: () => { showInFinder(path); },
                    btnLabel: translate('notification.open.in.finder'),
                    variant: NotificationsQueueVariant.textOnly,
                });
            }
        });
    };

    const hardwareAccModalProps = typeof incomeHardwareAcceleration === 'boolean' ? {
        title: translate('restart.app'),
        description: translate('restart.app.desc.import'),
        submitText: translate('restart'),
        canClose: false,
    } : {
        cancel: true,
        title: translate('restart.app'),
        description: translate('restart.app.desc'),
        submitText: translate('restart'),
        cancelText: !hardwareAcceleration ? translate('hardware.dont.enable') : translate('hardware.dont.disable'),
        onClose: () => setShowHardwareModal(false),
    };

    const enabledFilters = filtersStore.enabledFilters.size;

    const getDisabledExtensionsStatus = () => {
        const navParam = {
            nav: (text: string) => (
                <Button
                    className={s.Settings_button}
                    type="text"
                    onClick={(e) => {
                        e?.stopPropagation();
                        window.API.settingsService.OpenSafariExtensionPreferences(
                            new OptionalStringValue(),
                        );
                    }}
                >
                    <Text className={theme.color.orange} type="t2">
                        {text}
                    </Text>
                </Button>
            ),
        };

        if (someExtensionsDisabled) {
            return translate('settings.safari.ext.warning', navParam);
        }

        if (allExtensionsDisabled) {
            return translate('settings.safari.ext.all.warning', navParam);
        }
    };

    return (
        <Layout type="settingsPage">
            <SettingsTitle
                elements={[{
                    text: translate('settings.export.settings'),
                    action: onExport,
                }, {
                    text: translate('settings.import.settings'),
                    action: onImport,
                }, {
                    text: translate('reset.defaults'),
                    action: () => setShowResetModal(!showResetModal),
                    className: theme.button.redText,
                }]}
                title={translate('menu.settings')}
                maxTopPadding
            />
            <Text className={s.Settings_sectionTitle} type="h5">{translate('settings.ad.blocking')}</Text>
            <SettingsItemLink
                additionalText={(
                    <Text className={s.Settings_enabled} type="t2">
                        {translate('filters.enabled', {
                            enabled: enabledFilters,
                        })}
                    </Text>
                )}
                description={translate('settings.filters.desc')}
                internalLink={RouteName.filters}
                title={translate('settings.filters')}
            />
            <SettingsItemLink
                additionalText={(
                    <>
                        <Text className={s.Settings_enabled} type="t2">{translate('filters.enabled', { enabled: settings.enabledSafariExtensionsCount })}</Text>
                        {!allExtensionsEnabled && (
                            <Text className={s.Settings_enabled_warning} type="t2">
                                {getDisabledExtensionsStatus()}
                            </Text>
                        )}
                    </>
                )}
                description={translate('settings.safari.ext.desc')}
                internalLink={RouteName.safari_extensions}
                title={translate('settings.safari.ext')}
            />
            <Text className={s.Settings_sectionTitle} type="h5">{translate('settings.updates')}</Text>
            <SettingsItemSwitch
                description={translate('settings.update.filters.auto.desc')}
                setValue={(e) => {
                    settings.updateAutoFiltersUpdate(e);
                    telemetry.trackEvent(SettingsEvent.UpdateFiltersAutoClick);
                }}
                title={translate('settings.update.filters.auto')}
                value={autoFiltersUpdate}
            />
            <SettingsItemSwitch
                additionalText={payedFuncsTitle || (!autoFiltersUpdate && (
                    <Text className={theme.color.orange} type="t2">
                        {translate('settings.real.time.filter.updates.enable.update.filters')}
                    </Text>
                ))}
                description={translate('settings.real.time.filter.updates.desc')}
                muted={!!payedFuncsTitle || !autoFiltersUpdate}
                setValue={(e) => {
                    if (!isLicenseOrTrialActive) {
                        account.showPaywall();
                        return;
                    }
                    settings.updateRealTimeFiltersUpdate(e);
                    telemetry.trackEvent(SettingsEvent.RealTimeUpdatesClick);
                }}
                title={translate('settings.real.time.filter.updates')}
                value={realTimeFiltersUpdate}
            />
            <Text className={s.Settings_sectionTitle} type="h5">{translate('settings.app')}</Text>
            <SettingsItemSwitch
                setValue={(e) => settings.updateLaunchOnStartup(e)}
                title={translate('settings.launch.on.start')}
                value={launchOnStartup}
            />
            <SettingsItemSwitch
                setValue={(e) => settings.updateShowInMenuBar(e)}
                title={translate('settings.show.in.menu')}
                value={showInMenuBar}
            />
            {/* <SettingsItemSwitch
                title={translate('settings.hardware.acceleration')}
                description={translate('settings.hardware.acceleration.desc')}
                value={hardwareAcceleration}
                setValue={() => setShowHardwareModal(true)}
            /> */}
            <SettingsItemLink
                description={themeText(themeSetting)}
                internalLink={RouteName.theme}
                title={translate('settings.theme')}
            />
            <SettingsItemLink
                description={quitReactionText(quitReaction)}
                internalLink={RouteName.quit_reaction}
                title={translate('settings.hardware.quit.reaction')}
            />
            <Text className={s.Settings_sectionTitle} type="h5">{translate('settings.miscellaneous')}</Text>
            <SettingsItemSwitch
                setValue={(e) => settings.updateAllowTelemetry(e)}
                title={translate('telemetry.accept.send.data', {
                    link: (text: string) => (
                        <div
                            className={s.Settings_telemetryModalLink}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowTelemetryModal(true);
                            }}
                        >
                            {text}
                        </div>
                    ),
                })}
                value={allowTelemetry}
            />
            <SettingsItemSwitch
                additionalText={(
                    <Text className={theme.color.orange} type="t2">
                        {translate('settings.debug.warning')}
                    </Text>
                )}
                description={translate('settings.debug.desc')}
                setValue={(e) => settings.updateDebugLogging(e)}
                title={translate('settings.debug')}
                value={debugLogging}
            />
            <SettingsItemLink
                description={translate('settings.export.desc')}
                title={translate('settings.export')}
                onClick={onExportLogs}
            />
            <div className={theme.layout.bottomPadding} />
            {showResetModal && (
                <Modal
                    childrenClassName={s.Settings_resetWarning}
                    description={translate('reset.defaults.all.desc')}
                    submitAction={onReset}
                    submitClassName={theme.button.redSubmit}
                    submitText={translate('reset')}
                    title={`${translate('reset.defaults')}?`}
                    cancel
                    submit
                    onClose={() => setShowResetModal(false)}
                >
                    <div className={theme.color.orange}>
                        <Text type="t1">{translate('reset.defaults.all.warning')}</Text>
                    </div>
                </Modal>
            )}
            {showHardwareModal && (
                <Modal
                    submit
                    {...hardwareAccModalProps}
                    submitAction={onHardwareChange}
                    submitClassName={theme.button.greenSubmit}
                />
            )}
            {hardwareModalLoader && (
                <Modal
                    canClose={false}
                    loaderText={translate('applying.changes')}
                />
            )}
            {showConsentModal && (
                <ConsentModal
                    filters={storeFilters.filter((f) => showConsentModal?.includes(f.id))}
                    onClose={() => onConsent(ImportMode.withoutAnnoyance)}
                    onEnable={() => onConsent(ImportMode.full)}
                    onPartial={() => onConsent(ImportMode.withoutAnnoyance)}
                />
            )}
            {showTelemetryModal && <AppUsageDataModal onClose={() => setShowTelemetryModal(false)} />}
        </Layout>
    );
}

export const Settings = observer(SettingsComponent);
