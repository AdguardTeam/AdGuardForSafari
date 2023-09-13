//
//  SafariExtensionHandler.m
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Adguard Software Ltd. All rights reserved.
//

#import "SafariExtensionHandler.h"
#import "SafariExtensionViewController.h"
#import "ACLang.h"
#import "AESharedResources.h"
#import "AdGuardForSafariExtension-Swift.h"

@interface SafariExtensionHandler ()

@end

@implementation SafariExtensionHandler

static NSMutableArray *_onReadyBlocks;
static BOOL _mainAppReady;

+ (void)initialize {
    if (self == [SafariExtensionHandler class]) {
        _onReadyBlocks = [NSMutableArray new];
        _mainAppReady = NO;
        [AESharedResources initLogger];

        DDLogInfo(@"AG: Initialize SafariExtensionHandler");

        [AESharedResources setListenerOnBusyChanged:^{
            DDLogDebugTrace();
            [SafariExtensionViewController.sharedController setEnabledButton]; //this call peforms tuning all views
            SafariExtensionViewController.sharedController.busy = [AESharedResources.sharedDefaults boolForKey:AEDefaultsMainAppBusy];
            if (SafariExtensionViewController.sharedController.busy == NO) {
                [SFSafariApplication setToolbarItemsNeedUpdate]; // because changes can happen in main app
                [SafariExtensionViewController.sharedController reloadPage];
            }
        }];
        [AESharedResources setListenerOnReady:^{
            @synchronized(_onReadyBlocks) {
                _mainAppReady = YES;
                for (dispatch_block_t block in _onReadyBlocks) {
                    dispatch_async(dispatch_get_main_queue(), block);
                }
                [_onReadyBlocks removeAllObjects];
            }
        }];
        [AESharedResources setListenerOnAllExtensionEnabledResponse:^{
            DDLogDebugTrace();
            dispatch_async(dispatch_get_main_queue(), ^{
                SafariExtensionViewController.sharedController.allExtensionEnabled =
                [AESharedResources.sharedDefaults boolForKey:AEDefaultsAllExtensionsEnabled];
                DDLogInfo(@"AG: Received OnAllExtensionEnabledResponse with value: %d", SafariExtensionViewController.sharedController.allExtensionEnabled);
            });
        }];
    }
}

+ (void)onReady:(dispatch_block_t)block {
    @synchronized(_onReadyBlocks) {
        if (_mainAppReady) {
            dispatch_async(dispatch_get_main_queue(), block);
            return;
        }
        [_onReadyBlocks addObject:block];
    }
}

- (void)messageReceivedWithName:(NSString *)messageName fromPage:(SFSafariPage *)page userInfo:(NSDictionary *)userInfo {
    @autoreleasepool {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
        [page getPagePropertiesWithCompletionHandler:^(SFSafariPageProperties *properties) {
            DDLogInfo(@"AG: The extension received a message (%@) from a script injected into (%@) with userInfo (%@)", messageName, properties.url, userInfo);
        }];
        if ([messageName isEqualToString:@"blockElementPong"]) {
            [page dispatchMessageToScriptWithName:@"blockElement" userInfo:NULL];
            if (@available(macOS 10.14.4, *)) {
                [SafariExtensionViewController.sharedController dismissPopover];
            }
        }
        else if ([messageName isEqualToString:@"ruleResponse"]) {
            DDLogInfo(@"AG: Adding rule to user filter: %@", userInfo[@"rule"]);
            NSString *newRule = userInfo[@"rule"];
            if (newRule.length) {
                [AESharedResources userFilterRulesWithCompletion:^(NSArray<NSString *> *rules) {
                    @autoreleasepool {
                        NSArray *newRules = [rules arrayByAddingObject:newRule] ?: @[newRule];
                        [AESharedResources setUserFilterRules:newRules completion:^{
                            [AESharedResources notifyUserFilterChanged];
                        }];
                    }
                }];
            }
        }
        else if ([messageName isEqualToString:@"addFilterSubscription"]) {
            DDLogInfo(@"AG: Adding custom filter with url: %@, and title: %@", userInfo[@"url"], userInfo[@"title"]);
            [AESharedResources setCustomFilterInfo:userInfo completion:^{
                [AESharedResources notifyCustomFilterInfoSet];
            }];
        }
        else {
            DDLogInfo(@"AG: Handling by advanced blocker handler");
            [AdvancedBlockerHandler messageReceivedWithName:messageName from:page userInfo:userInfo];
        }
    }
}

- (void)toolbarItemClickedInWindow:(SFSafariWindow *)window {
    // This method will be called when your toolbar item is clicked.
    DDLogDebugTrace();
}

- (void)validateToolbarItemInWindow:(SFSafariWindow *)window validationHandler:(void (^)(BOOL enabled, NSString *badgeText))validationHandler {
    // This method will be called whenever some state changes passed in the window. You should use this as a chance to enable or disable your toolbar item and set badge text.
    DDLogDebugTrace();
    [window getToolbarItemWithCompletionHandler:^(SFSafariToolbarItem * _Nullable toolbarItem) {
        BOOL protectionEnabled = NO;
        if ([self setMainAppRunning]) {
            protectionEnabled = [[AESharedResources sharedDefaults] boolForKey:AEDefaultsEnabled];
        }
        else {
            [[AESharedResources sharedDefaults] setBool:NO forKey:AEDefaultsMainAppBusy];
        }
        [window getActiveTabWithCompletionHandler:^(SFSafariTab * _Nullable activeTab) {
            [activeTab getActivePageWithCompletionHandler:^(SFSafariPage * _Nullable activePage) {
                [activePage getPagePropertiesWithCompletionHandler:^(SFSafariPageProperties * _Nullable properties) {
                    SafariExtensionViewController.sharedController.currentPageUrl = nil;
                    if (properties) {
                        SafariExtensionViewController.sharedController.currentPageUrl = [properties.url copy];
                        if (protectionEnabled) {
                            [AESharedResources allowlistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
                                dispatch_async(dispatch_get_main_queue(), ^{
                                    DDLogDebug(@"Allowlist domains:\n%@", domains);
                                    BOOL inAllowlist = [SafariExtensionViewController.sharedController domainCheckWithDomains:domains];
                                    BOOL allowlistInverted = [[AESharedResources sharedDefaults] boolForKey:AEDefaultsAllowlistInverted];
                                    BOOL toolbarEnabled = allowlistInverted ? inAllowlist : !inAllowlist;
                                    [toolbarItem setImage:(toolbarEnabled ?
                                                           [NSImage imageNamed:@"toolbar-on"] :
                                                           [NSImage imageNamed:@"toolbar-off"])];
                                    validationHandler(YES, nil);
                                });
                            }];
                            return;
                        }
                    }
                    [toolbarItem setImage:(protectionEnabled ?
                                           [NSImage imageNamed:@"toolbar-on"] :
                                           [NSImage imageNamed:@"toolbar-off"])];
                    validationHandler(YES, nil);
                }];
            }];
        }];
    }];
}

- (SFSafariExtensionViewController *)popoverViewController {
    return [SafariExtensionViewController sharedController];
}

- (void)popoverWillShowInWindow:(SFSafariWindow *)window {
    DDLogDebugTrace();
    [self setMainAppRunning];
    SafariExtensionViewController.sharedController.busy = [AESharedResources.sharedDefaults boolForKey:AEDefaultsMainAppBusy];
    SafariExtensionViewController.sharedController.allExtensionEnabled = [AESharedResources.sharedDefaults boolForKey:AEDefaultsAllExtensionsEnabled];
    [SafariExtensionViewController.sharedController setEnabledButton]; //this call peforms tuning all views
    [AESharedResources requestAllExtensionEnabled];
}

- (void)messageReceivedFromContainingAppWithName:(NSString *)messageName userInfo:(NSDictionary<NSString *,id> *)userInfo {
}

- (BOOL)setMainAppRunning {
    BOOL running = ([NSRunningApplication runningApplicationsWithBundleIdentifier:AG_BUNDLEID].count > 0);
    SafariExtensionViewController.sharedController.mainAppRunning = running;
    @synchronized(_onReadyBlocks) {
        if (running == NO) {
            _mainAppReady = NO;
        }
    }
    return running;
}
@end
