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

@implementation AEMainAppServices

+ (void)startListenerForRequestsToMainApp {
    [AESharedResources setListenerOnAllExtensionEnabledRequest:^{
        [AEMainAppServices performAllExtensionEnabledRequest];
    }];
    DDLogInfo(@"Set listener on AllExtensionEnabledRequest");
}

/////////////////////////////////////////////////////////////////////
#pragma mark Internal processed request (private)

+ (void)performAllExtensionEnabledRequest {
    void (^badBlock)(void)  = ^(void) { //Block which sets bad result for this checking
        [AESharedResources.sharedDefaults
         setBool:NO
         forKey:AEDefaultsAllExtensionsEnabled];
        [AESharedResources synchronizeSharedDefaults];
        [AESharedResources responseAllExtensionEnabled];
        DDLogDebug(@"Checking enabled extensions finished with failure.");
    };
    DDLogDebug(@"Checking enabled extensions...");
    [SFSafariExtensionManager
     getStateOfSafariExtensionWithIdentifier:AESharedResources.advancedBlockingBundleId  // Advanced
     completionHandler:^(SFSafariExtensionState * _Nullable state, NSError * _Nullable error) {
         DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.advancedBlockingBundleId, state.enabled, error, error.userInfo);
         if (error == nil && state.enabled) {
                 [SFContentBlockerManager
                  getStateOfContentBlockerWithIdentifier:AESharedResources.blockerBundleId // Base blocker
                  completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                      DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerBundleId, state.enabled, error, error.userInfo);
                      if (error == nil && state.enabled) {
                              [SFContentBlockerManager
                               getStateOfContentBlockerWithIdentifier:AESharedResources.blockerPrivacyBundleId // Privacy blocker
                               completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                                   DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerPrivacyBundleId, state.enabled, error, error.userInfo);
                                   if (error == nil && state.enabled) {
                                           [SFContentBlockerManager
                                            getStateOfContentBlockerWithIdentifier:AESharedResources.blockerSecurityBundleId // Security blocker
                                            completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                                                DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerSecurityBundleId, state.enabled, error, error.userInfo);
                                                if (error == nil && state.enabled) {
                                                        [SFContentBlockerManager
                                                         getStateOfContentBlockerWithIdentifier:AESharedResources.blockerOtherBundleId // Other blocker
                                                         completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                                                             DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerOtherBundleId, state.enabled, error, error.userInfo);
                                                             if (error == nil && state.enabled) {
                                                                     [SFContentBlockerManager
                                                                      getStateOfContentBlockerWithIdentifier:AESharedResources.blockerCustomBundleId // Custom blocker
                                                                      completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                                                                          DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerCustomBundleId, state.enabled, error, error.userInfo);
                                                                          if (error == nil && state.enabled) {
                                                                                  [SFContentBlockerManager
                                                                                   getStateOfContentBlockerWithIdentifier:AESharedResources.blockerSocialBundleId // Social blocker
                                                                                   completionHandler:^(SFContentBlockerState * _Nullable state, NSError * _Nullable error) {
                                                                                       DDLogVerbose(@"Enabled extensions '%@': %d, error %@, userInfo: %@", AESharedResources.blockerSocialBundleId, state.enabled, error, error.userInfo);
                                                                                       if (error == nil && state.enabled) {
                                                                                           dispatch_async(dispatch_get_main_queue(), ^{ //Save good result of the checking
                                                                                               [AESharedResources.sharedDefaults
                                                                                                setBool:YES
                                                                                                forKey:AEDefaultsAllExtensionsEnabled];
                                                                                               [AESharedResources synchronizeSharedDefaults];
                                                                                               [AESharedResources responseAllExtensionEnabled];
                                                                                               DDLogDebug(@"Checking enabled extensions finished with success.");
                                                                                           });
                                                                                           return;
                                                                                       }
                                                                                       badBlock();
                                                                                   }];
                                                                              return;
                                                                          }
                                                                          badBlock();
                                                                      }];
                                                                 return;
                                                             }
                                                             badBlock();
                                                         }];
                                                    return;
                                                }
                                                badBlock();
                                            }];
                                       return;
                                   }
                                   badBlock();
                               }];
                          return;
                      }
                      badBlock();
                  }];
             return;
         }
         badBlock();
     }];
}


@end
