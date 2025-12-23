// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useLayoutEffect } from 'preact/hooks';

import { useTrayStore } from 'TrayLib/hooks';
import { getColorTheme } from 'Utils/colorThemes';

import type { EffectiveTheme } from 'Apis/types';
import type { OnColorThemeChanged } from 'Utils/colorThemes';

/**
 * Hook for theme changes
 */
export function useTheme(onThemeChanged: OnColorThemeChanged) {
    const trayStore = useTrayStore();
    const { trayWindowEffectiveThemeChanged } = trayStore;

    useLayoutEffect(() => {
        // Get effective theme on mount
        (async () => {
            const value = await trayStore.getEffectiveTheme();
            onThemeChanged(getColorTheme(value));
        })();

        return trayWindowEffectiveThemeChanged.addEventListener((value: EffectiveTheme) => {
            onThemeChanged(getColorTheme(value));
        });
    }, []);
}
