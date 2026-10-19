/* This code was generated automatically by proto-parser tool version 1 */
import { IAccountCallbackService, IAccountCallbackServiceInternal, AccountCallbackService } from './AccountCallbackService';
import { AccountCallbackServiceInternal } from './AccountCallbackServiceInternal';
import { IFiltersCallbackService, IFiltersCallbackServiceInternal, FiltersCallbackService } from './FiltersCallbackService';
import { FiltersCallbackServiceInternal } from './FiltersCallbackServiceInternal';
import { IOnboardingCallbackService, IOnboardingCallbackServiceInternal, OnboardingCallbackService } from './OnboardingCallbackService';
import { OnboardingCallbackServiceInternal } from './OnboardingCallbackServiceInternal';
import { ISettingsCallbackService, ISettingsCallbackServiceInternal, SettingsCallbackService } from './SettingsCallbackService';
import { SettingsCallbackServiceInternal } from './SettingsCallbackServiceInternal';
import { ITrayCallbackService, ITrayCallbackServiceInternal, TrayCallbackService } from './TrayCallbackService';
import { TrayCallbackServiceInternal } from './TrayCallbackServiceInternal';
import { IUserRulesCallbackService, IUserRulesCallbackServiceInternal, UserRulesCallbackService } from './UserRulesCallbackService';
import { UserRulesCallbackServiceInternal } from './UserRulesCallbackServiceInternal';

export class API_CALLBACK {
    accountCallbackService: IAccountCallbackService;
    filtersCallbackService: IFiltersCallbackService;
    onboardingCallbackService: IOnboardingCallbackService;
    settingsCallbackService: ISettingsCallbackService;
    trayCallbackService: ITrayCallbackService;
    userRulesCallbackService: IUserRulesCallbackService;

    constructor(
        accountCallbackServiceInternal: IAccountCallbackServiceInternal,
        filtersCallbackServiceInternal: IFiltersCallbackServiceInternal,
        onboardingCallbackServiceInternal: IOnboardingCallbackServiceInternal,
        settingsCallbackServiceInternal: ISettingsCallbackServiceInternal,
        trayCallbackServiceInternal: ITrayCallbackServiceInternal,
        userRulesCallbackServiceInternal: IUserRulesCallbackServiceInternal,
    )
    {
        this.accountCallbackService = new AccountCallbackService(accountCallbackServiceInternal);
        this.filtersCallbackService = new FiltersCallbackService(filtersCallbackServiceInternal);
        this.onboardingCallbackService = new OnboardingCallbackService(onboardingCallbackServiceInternal);
        this.settingsCallbackService = new SettingsCallbackService(settingsCallbackServiceInternal);
        this.trayCallbackService = new TrayCallbackService(trayCallbackServiceInternal);
        this.userRulesCallbackService = new UserRulesCallbackService(userRulesCallbackServiceInternal);
    }
}

export {
            IAccountCallbackService, IAccountCallbackServiceInternal, AccountCallbackService, AccountCallbackServiceInternal,
            IFiltersCallbackService, IFiltersCallbackServiceInternal, FiltersCallbackService, FiltersCallbackServiceInternal,
            IOnboardingCallbackService, IOnboardingCallbackServiceInternal, OnboardingCallbackService, OnboardingCallbackServiceInternal,
            ISettingsCallbackService, ISettingsCallbackServiceInternal, SettingsCallbackService, SettingsCallbackServiceInternal,
            ITrayCallbackService, ITrayCallbackServiceInternal, TrayCallbackService, TrayCallbackServiceInternal,
            IUserRulesCallbackService, IUserRulesCallbackServiceInternal, UserRulesCallbackService, UserRulesCallbackServiceInternal,
    };
