// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'preact/hooks';

import { ConsentModal } from 'Common/components';
import { useLottieElementAdapter, useOnboardingStore } from 'OnboardingLib/hooks';

import { Step } from '../Step';

/**
 * Step "Annoyances"
 */
function AnnoyancesComponent() {
    const { steps, steps: { annoyanceFilters, annoyanceHasBeenAccepted } } = useOnboardingStore();
    const [showConsentModal, setShowConsentModal] = useState(false);

    const elLottieRef = useRef<HTMLLottieElement | null>(null);
    const { startLottie, finishLottie } = useLottieElementAdapter(elLottieRef);
    useEffect(startLottie, [startLottie]);

    const primaryAction = () => {
        if (annoyanceHasBeenAccepted) {
            finishLottie(async () => steps.shouldBlockAnnoyances(true));
        } else {
            setShowConsentModal(true);
        }
    };

    const onEnable = () => {
        setShowConsentModal(false);
        finishLottie(async () => steps.shouldBlockAnnoyances(true));
    };

    return (
        <>
            <Step
                description={translate('onboarding.annoyances.desc')}
                elLottieRef={elLottieRef}
                lottie="annoyances"
                primaryButton={{ action: primaryAction, label: translate('onboarding.block.btn') }}
                secondaryButton={{ action: async () => steps.shouldBlockAnnoyances(false), label: translate('onboarding.dont.block.btn') }}
                title={translate('onboarding.annoyances.title')}
                imageSmall
            />
            {showConsentModal && (
                <ConsentModal
                    filters={annoyanceFilters}
                    onClose={() => setShowConsentModal(false)}
                    onEnable={onEnable}
                />
            )}
        </>
    );
}

export const Annoyances = observer(AnnoyancesComponent);
