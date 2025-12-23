// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createContext } from 'preact';

import { EmptyValue } from 'Apis/types';
import { Action } from 'Common/utils/EventAction';

import {
    Account,
    AdvancedBlocking,
    AppInfo,
    Filters,
    Router,
    SafariProtection,
    Settings,
    UserRules,
    Windowing,
    NotificationsQueue,
    UI,
} from './modules';

import type { EffectiveTheme } from 'Apis/types';
import type { ColorTheme } from 'Utils/colorThemes';

/**
 * Settings app store
 */
export class SettingsStore {
    account: Account;

    advancedBlocking: AdvancedBlocking;

    appInfo: AppInfo;

    filters: Filters;

    router: Router;

    safariProtection: SafariProtection;

    settings: Settings;

    userRules: UserRules;

    windowing: Windowing;

    notification: NotificationsQueue;

    ui: UI;

    /**
     * Settings window effective theme changed event
     */
    public readonly settingsWindowEffectiveThemeChanged = new Action<EffectiveTheme>();

    /**
     * ctor
     */
    constructor() {
        this.account = new Account(this);
        this.advancedBlocking = new AdvancedBlocking(this);
        this.appInfo = new AppInfo(this);
        this.filters = new Filters(this);
        this.router = new Router(this);
        this.safariProtection = new SafariProtection(this);
        this.settings = new Settings(this);
        this.userRules = new UserRules(this);
        this.ui = new UI(this);
        this.windowing = new Windowing();
        this.notification = new NotificationsQueue();
        this.init();
    }

    /**
     * initializing function
     */
    private init() {
        this.account.getLicense();
        this.account.getTrialAvailability();
        this.advancedBlocking.getAdvancedBlocking();
        this.appInfo.getAppInfo();
        this.filters.getEnabledFilters();
        this.filters.getFilters();
        this.filters.getFiltersIndex();
        this.filters.getFiltersGroupedByExtension();
        this.settings.getSettings();
        this.settings.getSafariExtensions();
        this.settings.getUserActionLastDirectory();
        this.userRules.getUserRules();
    }

    /**
     * Get effective theme
     */
    public async getEffectiveTheme(): Promise<EffectiveTheme> {
        const { value } = await window.API.settingsService.GetEffectiveTheme(new EmptyValue());
        return value;
    }

    /**
    * Color theme setter
    */
    public setColorTheme(colorTheme: ColorTheme) {
        this.windowing.updateTheme(colorTheme);
    }
}

export const store = new SettingsStore();
const StoreContext = createContext<SettingsStore>(store);
export default StoreContext;
