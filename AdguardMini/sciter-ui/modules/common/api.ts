// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import {
    AccountService,
    AdvancedBlockingService,
    AppInfoService,
    FiltersService,
    InternalService,
    SettingsService,
    UserRulesService,
    OnboardingService,
    TrayService,
} from 'Apis/services';
import 'Apis/ExtendLicense';

/**
 * API facade
 */
export class API {
    public readonly internalService = new InternalService();

    public readonly filtersService = new FiltersService();

    public readonly accountService = new AccountService();

    public readonly advancedBlockingService = new AdvancedBlockingService();

    public readonly appInfoService = new AppInfoService();

    public readonly settingsService = new SettingsService();

    public readonly userRulesService = new UserRulesService();

    public readonly onboardingService = new OnboardingService();

    public readonly trayService = new TrayService();
}

// @TODO: MOVE THIS TO declaration.d.ts
declare global {
    const API: API;
    interface Window {
        API: API;
    }
}

window.API = new API();
