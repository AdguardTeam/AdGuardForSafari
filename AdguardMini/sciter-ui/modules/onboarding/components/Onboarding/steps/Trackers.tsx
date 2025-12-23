// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'preact/hooks';

import { useLottieElementAdapter, useOnboardingStore } from 'OnboardingLib/hooks';

import { Step } from '../Step';

/**
 * Step "Trackers"
 */
function TrackersComponent() {
    const { steps } = useOnboardingStore();

    const elLottieRef = useRef<HTMLLottieElement | null>(null);
    const { startLottie, finishLottie } = useLottieElementAdapter(elLottieRef);
    useEffect(startLottie, [startLottie]);

    return (
        <Step
            description={translate('onboarding.trackers.desc')}
            elLottieRef={elLottieRef}
            lottie="trackers"
            primaryButton={{ action: () => finishLottie(async () => steps.shouldBlockTrackers(true)), label: translate('onboarding.block.btn') }}
            secondaryButton={{ action: async () => steps.shouldBlockTrackers(false), label: translate('onboarding.dont.block.btn') }}
            title={translate('onboarding.trackers.title')}
            imageSmall
        />
    );
}

export const Trackers = observer(TrackersComponent);
