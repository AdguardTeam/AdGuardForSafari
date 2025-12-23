// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';

import { useSettingsStore, usePayedFuncsTitle } from 'SettingsLib/hooks';
import { SettingsTitle, Layout } from 'UILib';

import { SettingsItemSwitch } from '../SettingsItem';
/**
 * Advanced Blocking page in settings module
 */
function AdvancedBlockingComponent() {
    const { advancedBlocking, account } = useSettingsStore();
    const { advancedBlocking: {
        advancedRules,
        adguardExtra,
    } } = advancedBlocking;
    const { isLicenseOrTrialActive } = account;

    const payedFuncsTitle = usePayedFuncsTitle();

    return (
        <Layout type="settingsPage">
            <SettingsTitle
                description={translate('advanced.blocking.desc')}
                title={translate('menu.advanced.blocking')}
                maxTopPadding
            />
            <SettingsItemSwitch
                description={translate('advanced.blocking.rules.desc')}
                icon="star"
                setValue={(e) => advancedBlocking.updateAdvancedRules(e)}
                title={translate('advanced.blocking.rules')}
                value={advancedRules}
            />
            <SettingsItemSwitch
                additionalText={payedFuncsTitle}
                description={translate('advanced.blocking.extra.desc')}
                icon="extra"
                muted={!isLicenseOrTrialActive}
                setValue={(e) => {
                    if (!isLicenseOrTrialActive) {
                        account.showPaywall();
                        return;
                    }
                    advancedBlocking.updateAdguardExtra(e);
                }}
                title={translate('advanced.blocking.extra')}
                value={isLicenseOrTrialActive ? adguardExtra : false}
            />
        </Layout>
    );
}

export const AdvancedBlocking = observer(AdvancedBlockingComponent);
