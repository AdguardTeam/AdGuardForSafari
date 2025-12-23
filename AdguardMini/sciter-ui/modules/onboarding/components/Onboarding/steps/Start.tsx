// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useState } from 'preact/hooks';

import { ExternalLink } from 'Modules/common/components';
import { getTdsLink, TDS_PARAMS } from 'Modules/common/utils/links';
import { useOnboardingStore } from 'OnboardingLib/hooks';
import { OnboardingSteps } from 'OnboardingStore/modules';

import { Step } from '../Step';

import startImage from './images/start.svg';

/**
 * Step "Start"
 */
function StartComponent() {
    const { steps } = useOnboardingStore();

    const [checked, setChecked] = useState(false);

    const { safariExtensions } = steps;

    const action = () => {
        steps.setCurrentStep(safariExtensions.allExtensionsEnabled ? OnboardingSteps.ads : OnboardingSteps.extensions);
    };
    return (
        <Step
            checkbox={{
                label: translate('onboarding.accept', {
                    eula: (text: string) => (
                        <ExternalLink href={getTdsLink(TDS_PARAMS.eula)} textType="t1">{text}</ExternalLink>
                    ),
                    privacy: (text: string) => (
                        <ExternalLink href={getTdsLink(TDS_PARAMS.privacy)} textType="t1">{text}</ExternalLink>
                    ),
                }),
                checked,
                onChange: () => {
                    setChecked(!checked);
                },
            }}
            description={translate('onboarding.start.desc')}
            image={startImage}
            primaryButton={{ action, label: translate('onboarding.start.btn'), disabled: !checked }}
            title={translate('onboarding.start.title')}
        />
    );
}

export const Start = observer(StartComponent);
