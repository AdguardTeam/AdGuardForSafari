// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useLayoutEffect } from 'preact/hooks';

import { useSettingsStore } from 'SettingsLib/hooks';
import { getColorTheme, getEffectiveTheme } from 'Utils/colorThemes';

import { Theme, type EffectiveTheme } from 'Apis/types';
import type { OnColorThemeChanged } from 'Utils/colorThemes';

/**
 * Hook for theme changes
 */
export function useTheme(onThemeChanged: OnColorThemeChanged) {
    const settingsStore = useSettingsStore();
    const { settingsWindowEffectiveThemeChanged, settings: { settings: { theme } } } = settingsStore;

    useLayoutEffect(() => {
        if (theme === Theme.system) {
            (async () => {
                const value = await settingsStore.getEffectiveTheme();
                onThemeChanged(getColorTheme(value));
            })();

            return settingsWindowEffectiveThemeChanged.addEventListener((value: EffectiveTheme) => {
                onThemeChanged(getColorTheme(value));
            });
        }

        const value = getEffectiveTheme(theme);
        onThemeChanged(getColorTheme(value));
    }, [theme]);
}
