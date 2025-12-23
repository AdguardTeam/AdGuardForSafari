// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useLayoutEffect } from 'preact/hooks';

import { useSettingsStore } from 'SettingsLib/hooks';
import { getColorTheme } from 'Utils/colorThemes';

import type { EffectiveTheme } from 'Apis/types';
import type { OnColorThemeChanged } from 'Utils/colorThemes';

/**
 * Hook for theme changes
 */
export function useTheme(onThemeChanged: OnColorThemeChanged) {
    const settingsStore = useSettingsStore();
    const { settingsWindowEffectiveThemeChanged } = settingsStore;

    useLayoutEffect(() => {
        // Get effective theme on mount
        (async () => {
            const value = await settingsStore.getEffectiveTheme();
            onThemeChanged(getColorTheme(value));
        })();

        return settingsWindowEffectiveThemeChanged.addEventListener((value: EffectiveTheme) => {
            onThemeChanged(getColorTheme(value));
        });
    }, []);
}
