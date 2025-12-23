/*
 * SPDX-FileCopyrightText: AdGuard Software Limited
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useLottieElement } from '@adg/sciter-utils-kit';
import { useCallback, useState } from 'preact/hooks';

import type { UseLottieElementParams } from '@adg/sciter-utils-kit';

type UseLottieElementAdapterParams = UseLottieElementParams;

/**
 * Adapter for useLottieElement hook from sciter-utils-kit
 */
export function useLottieElementAdapter(elLottieRef: UseLottieElementAdapterParams['elLottieRef']) {
    const [done, setDone] = useState(false);

    const { play } = useLottieElement(elLottieRef);

    const startLottie = useCallback(() => {
        play(
            { loop: false, marker: [0, 2] },
            () => play({ loop: true, marker: [1, 2] }),
        );
    }, [play]);

    const finishLottie = useCallback((onLottieDone: () => void) => {
        if (done) {
            return;
        }

        setDone(true);

        play(
            { loop: false, marker: [2, 3] },
            onLottieDone,
        );
    }, [play, done]);

    return { startLottie, finishLottie };
}
