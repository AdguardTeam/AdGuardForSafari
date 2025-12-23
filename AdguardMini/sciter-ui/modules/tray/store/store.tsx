// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createContext } from 'preact';

import { EmptyValue } from 'Apis/types';
import { Action } from 'Modules/common/utils/EventAction';

import { NotificationsQueue } from './modules/NotificationsQueue';
import { Router } from './modules/Router';
import { SettingsStore } from './modules/Settings';

import type { EffectiveTheme } from 'Apis/types';

/**
 * Store used in Tray
 */
export class TrayStore {
    public router: Router;

    public settings: SettingsStore;

    public notification: NotificationsQueue;

    /**
     * Tray window visibility changed event
     */
    public readonly trayWindowVisibilityChanged = new Action<boolean>();

    /**
     * Tray window effective theme changed event
     */
    public readonly trayWindowEffectiveThemeChanged = new Action<EffectiveTheme>();

    /**
     *
     */
    public constructor() {
        this.router = new Router(this);
        this.settings = new SettingsStore(this);
        this.notification = new NotificationsQueue();
    }

    /**
     * Get effective theme
     */
    public async getEffectiveTheme(): Promise<EffectiveTheme> {
        const { value } = await window.API.trayService.GetEffectiveTheme(new EmptyValue());
        return value;
    }
}

export const store = new TrayStore();
const StoreContext = createContext<TrayStore>(store);
export default StoreContext;
