// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect } from 'preact/hooks';

import { useSettingsStore } from 'SettingsLib/hooks';

/**
 * Updates the state of the safari extensions on window focus
 */
export function useUpdateSafariExtensions() {
    const { settings } = useSettingsStore();

    useEffect(() => {
        window.SciterWindow.on('activate', ({ reason }) => {
            // Window got focus
            if (reason > 0) {
                settings.getSafariExtensions();
            }
        });

        return () => {
            window.SciterWindow.off('activate');
        };
    }, [settings]);
}
