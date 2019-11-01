//
//  AEMainAppServices.m
//  shared
//
//  Created by Roman Sokolov on 05/09/2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

#import "AEMainAppServices.h"
#import "AESharedResources.h"
#import "CommonLib/ACLang.h"
#import <SafariServices/SafariServices.h>
#import "AALaunchAtLogin.h"

@implementation AEMainAppServices

+ (void)startListenerForRequestsToMainApp {
    [AESharedResources setListenerOnAllExtensionEnabledRequest:^{
        [AEMainAppServices performAllExtensionEnabledRequest];
    }];
    DDLogInfo(@"AG: Set listener on AllExtensionEnabledRequest");
}

+ (void)setStartAtLogin:(BOOL)startAtLogin {
    @autoreleasepool {
        AALaunchAtLogin *loginItem = [[AALaunchAtLogin alloc] initWithIdentifier:AG_LOGIN_HELPER_BUNDLEID];
        loginItem.startAtLogin = startAtLogin;
    }
}
+ (BOOL)startAtLogin {
    @autoreleasepool {
        AALaunchAtLogin *loginItem = [[AALaunchAtLogin alloc] initWithIdentifier:AG_LOGIN_HELPER_BUNDLEID];
        BOOL result = loginItem.startAtLogin;
        return result;
    }
}

+ (void)removeOldLoginItemWithCompletion:(void (^)(BOOL result))completion{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
        BOOL result = [AALaunchAtLogin removeOldLoginItem];
        if (completion) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(result);
            });
        }
    });

}
/////////////////////////////////////////////////////////////////////
#pragma mark Internal processed request (private)

+ (void)performAllExtensionEnabledRequest {
    DDLogInfo(@"AG: Checking enabled extensions...");
    [self checkExtension:AESharedResources.advancedBlockingBundleId // Advanced
    ifSuccess:^{
        [self checkBlocker:AESharedResources.blockerBundleId // Base blocker
        ifSuccess:^{
            [self checkBlocker:AESharedResources.blockerPrivacyBundleId // Privacy blocker
            ifSuccess:^{
                [self checkBlocker:AESharedResources.blockerSecurityBundleId // Security blocker
                ifSuccess:^{
                    [self checkBlocker:AESharedResources.blockerOtherBundleId // Other blocker
                    ifSuccess:^{
                        [self checkBlocker:AESharedResources.blockerCustomBundleId // Custom blocker
                        ifSuccess:^{
                            [self checkBlocker:AESharedResources.blockerSocialBundleId // Social blocker
                            ifSuccess:^{
                                //Save good result of the checking
                                [AESharedResources.sharedDefaults
                                 setBool:YES
                                 forKey:AEDefaultsAllExtensionsEnabled];
                                [AESharedResources synchronizeSharedDefaults];
                                [AESharedResources responseAllExtensionEnabled];
                                DDLogInfo(@"AG: Checking enabled extensions finished with success.");
                            }];
                            
                        }];
                        
                    }];
                    
                }];
                
            }];
            
        }];
    }];
}

/////////////////////////////////////////////////////////////////////
#pragma mark Helper methods (private)

+ (void)checkBlocker:(NSString *)blockerName ifSuccess:(void (^)(void))block;{
    [SFContentBlockerManager
     getStateOfContentBlockerWithIdentifier:blockerName
     completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
         DDLogInfo(@"AG: Enabled extensions '%@': %d, error %@, userInfo: %@", blockerName, state.enabled, error, error.userInfo);
         if (error == nil && state.enabled) {
             if (block) {
                 block();
             }
             return;
         }
         [self checkExtensionsFailure];
     }];
}

+ (void)checkExtension:(NSString *)extensionName ifSuccess:(void (^)(void))block;{
    [SFSafariExtensionManager
     getStateOfSafariExtensionWithIdentifier:extensionName
     completionHandler:^(SFSafariExtensionState * _Nullable state, NSError * _Nullable error) {
         DDLogInfo(@"AG: Enabled extensions '%@': %d, error %@, userInfo: %@", extensionName, state.enabled, error, error.userInfo);
         if (error == nil && state.enabled) {
             if (block) {
                 block();
             }
             return;
         }
         [self checkExtensionsFailure];
     }];
}

+ (void)checkExtensionsFailure {
    [AESharedResources.sharedDefaults
     setBool:NO
     forKey:AEDefaultsAllExtensionsEnabled];
    [AESharedResources synchronizeSharedDefaults];
    [AESharedResources responseAllExtensionEnabled];
    DDLogInfo(@"AG: Checking enabled extensions finished with failure.");
}

@end
