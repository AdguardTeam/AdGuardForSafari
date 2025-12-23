// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useLayoutEffect } from 'preact/hooks';

import { useOnboardingStore } from 'OnboardingLib/hooks';
import { getColorTheme } from 'Utils/colorThemes';

import type { EffectiveTheme } from 'Apis/types';
import type { OnColorThemeChanged } from 'Utils/colorThemes';

/**
 * Sets theme for onboarding window
 */
export function useTheme(onThemeChanged: OnColorThemeChanged) {
    const onboardingStore = useOnboardingStore();
    const { onboardingWindowEffectiveThemeChanged } = onboardingStore;

    useLayoutEffect(() => {
        // Get effective theme on mount
        (async () => {
            const value = await onboardingStore.getEffectiveTheme();
            onThemeChanged(getColorTheme(value));
        })();

        return onboardingWindowEffectiveThemeChanged.addEventListener((value: EffectiveTheme) => {
            onThemeChanged(getColorTheme(value));
        });
    }, []);
}
