// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';

import { useOnboardingStore, useTheme } from 'OnboardingLib/hooks';
import { OnboardingSteps } from 'OnboardingStore/modules';

import { Start, Extensions, Ads, Trackers, Annoyances, Finish } from './steps';

/**
 * Main onboarding entry
 */
function OnboardingComponent() {
    const { steps } = useOnboardingStore();

    const { currentStep } = steps;

    useTheme((theme) => {
        document.documentElement.setAttribute('theme', theme);
    });

    switch (currentStep) {
        case OnboardingSteps.start:
            return <Start />;
        case OnboardingSteps.extensions:
            return <Extensions />;
        case OnboardingSteps.ads:
            return <Ads />;
        case OnboardingSteps.trackers:
            return <Trackers />;
        case OnboardingSteps.annoyances:
            return <Annoyances />;
        case OnboardingSteps.finish:
            return <Finish />;
    }
}

export const Onboarding = observer(OnboardingComponent);
