//
//  SafariExtensionHandler.m
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "SafariExtensionHandler.h"
#import "SafariExtensionViewController.h"
#import "ACLang.h"
#import "AESharedResources.h"

@interface SafariExtensionHandler ()

@end

@implementation SafariExtensionHandler

+ (void)initialize {
    if (self == [SafariExtensionHandler class]) {
        [AESharedResources initLogger];
        [AESharedResources setListenerOnBusyChanged:^{
            DDLogDebugTrace();
            [SafariExtensionViewController.sharedController setEnabledButton]; //this call peforms tuning all views
            SafariExtensionViewController.sharedController.busy = [AESharedResources.sharedDefaults boolForKey:AEDefaultsMainAppBusy];
            if (SafariExtensionViewController.sharedController.busy == NO) {
                [SFSafariApplication setToolbarItemsNeedUpdate]; // because changes can happen in main app
            }
        }];
    }
}

- (void)messageReceivedWithName:(NSString *)messageName fromPage:(SFSafariPage *)page userInfo:(NSDictionary *)userInfo {
    // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
    [page getPagePropertiesWithCompletionHandler:^(SFSafariPageProperties *properties) {
        DDLogInfo(@"The extension received a message (%@) from a script injected into (%@) with userInfo (%@)", messageName, properties.url, userInfo);
    }];
}

- (void)toolbarItemClickedInWindow:(SFSafariWindow *)window {
    // This method will be called when your toolbar item is clicked.
    DDLogDebugTrace();
}

- (void)validateToolbarItemInWindow:(SFSafariWindow *)window validationHandler:(void (^)(BOOL enabled, NSString *badgeText))validationHandler {
    // This method will be called whenever some state changes in the passed in window. You should use this as a chance to enable or disable your toolbar item and set badge text.
    DDLogDebugTrace();
    BOOL running = ([NSRunningApplication runningApplicationsWithBundleIdentifier:AG_BUNDLEID].count > 0);
    SafariExtensionViewController.sharedController.mainAppRunning = running;
    [window getToolbarItemWithCompletionHandler:^(SFSafariToolbarItem * _Nullable toolbarItem) {
        if (running) {
            [toolbarItem setImage:([[AESharedResources sharedDefaults] boolForKey:AEDefaultsEnabled] ?
                                   [NSImage imageNamed:@"toolbar-on"] :
                                   [NSImage imageNamed:@"toolbar-off"])];
        }
        else {
            [toolbarItem setImage:[NSImage imageNamed:@"toolbar-off"]];
        }
        [window getActiveTabWithCompletionHandler:^(SFSafariTab * _Nullable activeTab) {
            [activeTab getActivePageWithCompletionHandler:^(SFSafariPage * _Nullable activePage) {
                [activePage getPagePropertiesWithCompletionHandler:^(SFSafariPageProperties * _Nullable properties) {
                    if (properties) {
                        SafariExtensionViewController.sharedController.domain = properties.url.host;
                        validationHandler(YES, nil);
                        return;
                    }
                    validationHandler(NO, nil);
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
    SafariExtensionViewController.sharedController.busy = [AESharedResources.sharedDefaults boolForKey:AEDefaultsMainAppBusy];
    [SafariExtensionViewController.sharedController setEnabledButton]; //this call peforms tuning all views
}

- (void)messageReceivedFromContainingAppWithName:(NSString *)messageName userInfo:(NSDictionary<NSString *,id> *)userInfo {
    DDLogInfo(@"The extension received a message (%@) from a containing app with userInfo (%@)", messageName, userInfo);

    NSDictionary *testData = @{
                               @"int-value": @(100),
                               @"string-value": @"ass with pen",
                               @"string-localized-value": @"жопа с ручкой"
                               };

    [AESharedResources setBlockingContentRulesJson:[NSJSONSerialization dataWithJSONObject:testData
                                                                                   options:0
                                                                                     error:NULL]
                                        completion:nil];
}
@end
