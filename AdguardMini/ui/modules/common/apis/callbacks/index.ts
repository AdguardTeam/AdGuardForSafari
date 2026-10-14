/* This code was generated automatically by proto-parser tool version 1 */
import { IOnboardingCallbackService, IOnboardingCallbackServiceInternal, OnboardingCallbackService } from './OnboardingCallbackService';
import { OnboardingCallbackServiceInternal } from './OnboardingCallbackServiceInternal';
import { ITrayCallbackService, ITrayCallbackServiceInternal, TrayCallbackService } from './TrayCallbackService';
import { TrayCallbackServiceInternal } from './TrayCallbackServiceInternal';
import { IUserRulesCallbackService, IUserRulesCallbackServiceInternal, UserRulesCallbackService } from './UserRulesCallbackService';
import { UserRulesCallbackServiceInternal } from './UserRulesCallbackServiceInternal';
import { IAccountCallbackService, IAccountCallbackServiceInternal, AccountCallbackService } from './AccountCallbackService';
import { AccountCallbackServiceInternal } from './AccountCallbackServiceInternal';
import { ISettingsCallbackService, ISettingsCallbackServiceInternal, SettingsCallbackService } from './SettingsCallbackService';
import { SettingsCallbackServiceInternal } from './SettingsCallbackServiceInternal';
import { IFiltersCallbackService, IFiltersCallbackServiceInternal, FiltersCallbackService } from './FiltersCallbackService';
import { FiltersCallbackServiceInternal } from './FiltersCallbackServiceInternal';

export class API_CALLBACK {
    onboardingCallbackService: IOnboardingCallbackService;
    trayCallbackService: ITrayCallbackService;
    userRulesCallbackService: IUserRulesCallbackService;
    accountCallbackService: IAccountCallbackService;
    settingsCallbackService: ISettingsCallbackService;
    filtersCallbackService: IFiltersCallbackService;

    constructor(
        onboardingCallbackServiceInternal: IOnboardingCallbackServiceInternal,
        trayCallbackServiceInternal: ITrayCallbackServiceInternal,
        userRulesCallbackServiceInternal: IUserRulesCallbackServiceInternal,
        accountCallbackServiceInternal: IAccountCallbackServiceInternal,
        settingsCallbackServiceInternal: ISettingsCallbackServiceInternal,
        filtersCallbackServiceInternal: IFiltersCallbackServiceInternal,
    )
    {
        this.onboardingCallbackService = new OnboardingCallbackService(onboardingCallbackServiceInternal);
        this.trayCallbackService = new TrayCallbackService(trayCallbackServiceInternal);
        this.userRulesCallbackService = new UserRulesCallbackService(userRulesCallbackServiceInternal);
        this.accountCallbackService = new AccountCallbackService(accountCallbackServiceInternal);
        this.settingsCallbackService = new SettingsCallbackService(settingsCallbackServiceInternal);
        this.filtersCallbackService = new FiltersCallbackService(filtersCallbackServiceInternal);
    }
}

export {
            IOnboardingCallbackService, IOnboardingCallbackServiceInternal, OnboardingCallbackService, OnboardingCallbackServiceInternal,
            ITrayCallbackService, ITrayCallbackServiceInternal, TrayCallbackService, TrayCallbackServiceInternal,
            IUserRulesCallbackService, IUserRulesCallbackServiceInternal, UserRulesCallbackService, UserRulesCallbackServiceInternal,
            IAccountCallbackService, IAccountCallbackServiceInternal, AccountCallbackService, AccountCallbackServiceInternal,
            ISettingsCallbackService, ISettingsCallbackServiceInternal, SettingsCallbackService, SettingsCallbackServiceInternal,
            IFiltersCallbackService, IFiltersCallbackServiceInternal, FiltersCallbackService, FiltersCallbackServiceInternal,
    };
