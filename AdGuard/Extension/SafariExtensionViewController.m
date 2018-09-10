//
//  SafariExtensionViewController.m
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "SafariExtensionViewController.h"
#import "ACLang.h"
#import "AESharedResources.h"

@interface SafariExtensionViewController ()
@end

@implementation SafariExtensionViewController

+ (SafariExtensionViewController *)sharedController {
    static SafariExtensionViewController *sharedController = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedController = [[SafariExtensionViewController alloc] initWithNibName:nil bundle:nil];
    });
    return sharedController;
}

- (void)viewDidLoad {

    DDLogDebugTrace();
    self.view.appearance = NSAppearance.currentAppearance;

//    [[NSWorkspace sharedWorkspace] addObserver:self
//                                    forKeyPath:@"runningApplications"
//                                       options:(NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld)
//                                       context:NULL];

}

- (void)dealloc {
    [AESharedResources setListenerOnBusyChanged:nil];
}
//////////////////////////////////////////////////////////////////////////
#pragma mark - ACTIONS

- (IBAction)clickEnabled:(id)sender {
    DDLogDebugTrace();
    [AESharedResources.sharedDefaults
     setBool:! [AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]
     forKey:AEDefaultsEnabled];
    self.busy = YES;
    [AESharedResources notifyDefaultsChanged];
}

- (IBAction)clickWhitelist:(id)sender {
    NSString *domain = self.domain;
    if (domain.length == 0) {
        return;
    }
    self.busy = YES;
    [AESharedResources whitelistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        DDLogDebugTrace();
        NSMutableArray *mDomains = [domains mutableCopy] ?: [NSMutableArray new];
        if ([self domainCheckWithDomains:mDomains]) {
            [mDomains removeObject:domain];
        }
        else {
            [mDomains addObject:domain];
        }
        [AESharedResources setWhitelistDomains:mDomains completion:^{
            DDLogDebugTrace();
            [AESharedResources notifyWhitelistChanged];
        }];
    }];
}

- (IBAction)clickAssistant:(id)sender {
    DDLogDebugTrace();
    //Launch script for select element on web page
    [SFSafariApplication getActiveWindowWithCompletionHandler:^(SFSafariWindow * _Nullable activeWindow) {
        [activeWindow getActiveTabWithCompletionHandler:^(SFSafariTab * _Nullable activeTab) {
            [activeTab getActivePageWithCompletionHandler:^(SFSafariPage * _Nullable activePage) {
                [activePage dispatchMessageToScriptWithName:@"blockElementPing" userInfo:NULL];
            }];
        }];
    }];
}

- (IBAction)clickRunAdguard:(id)sender {
    [[NSWorkspace sharedWorkspace] launchAppWithBundleIdentifier:AG_BUNDLEID
                                                         options:(NSWorkspaceLaunchWithoutActivation | NSWorkspaceLaunchAndHide)
                                  additionalEventParamDescriptor:nil
                                                launchIdentifier:NULL];
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties and Public methods

- (void)setEnabledButton {
    DDLogDebugTrace();
    if ([AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]) {

        self.adguardIcon.image = self.mainAppRunning ?
        [NSImage imageNamed:@"green-logo"]
        : [NSImage imageNamed:@"red-logo"];

        self.enabledButton.state = NSOnState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Enabled\" state.");
        [self setButtonsEnabled:YES];
    }
    else {

        self.adguardIcon.image = [NSImage imageNamed:@"red-logo"];
        self.enabledButton.state = NSOffState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Disabled\" state.");
        [self setButtonsEnabled:NO];
    }
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Private methods

- (BOOL)domainCheckWithDomains:(NSArray <NSString *> *)domains {
    NSString *theDomain = self.domain;
    if (theDomain.length) {
        for (NSString *domain in domains) {
            if (theDomain.hash == domain.hash && [theDomain isEqualToString:domain]) {
                return YES;
            }
            if ([theDomain hasSuffix:[@"." stringByAppendingString:domain]]) {
                return YES;
            }
        }
    }
    return NO;
}

- (void)setWhitelistButton {

    [AESharedResources whitelistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        DDLogDebugTrace();
        [self setWhitelistButtonOn:! [self domainCheckWithDomains:domains]];
    }];
}

- (void)setButtonsEnabled:(BOOL)enabled {

    self.otherButtonsEnabled = enabled;
    if (enabled) {
        [self setWhitelistButton];
    }
    else {
        [self setWhitelistButtonOn:NO];
    }
}

- (void)setWhitelistButtonOn:(BOOL)on {
    if (on) {
        self.whitelistButton.state = NSOnState;
        self.whitelistButton.title = NSLocalizedString(@"sae-popover-filter-this-site-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off filtration on this site, \"On\" state.");
    }
    else {
        self.whitelistButton.state = NSOffState;
        self.whitelistButton.title = NSLocalizedString(@"sae-popover-filter-this-site-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off filtration on this site, \"Off\" state.");
    }
}
//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties Observer

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
//    if ([keyPath isEqualToString:@"runningApplications"]) {
//        dispatch_async(dispatch_get_main_queue(), ^{
//            self.mainAppRunning = ([NSRunningApplication runningApplicationsWithBundleIdentifier:AG_BUNDLEID] != nil);
//        });
//    }
}

@end
