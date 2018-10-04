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
#import "SafariExtensionHandler.h"

@interface SafariExtensionViewController ()

@property BOOL showDisabledUI;
@end

@implementation SafariExtensionViewController {
    NSImage *_disabledLogo;
    NSImage *_enabledLogo;
}

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

//    [self setAppearance];
//    [self.view addObserver:self
//                forKeyPath:@"window"
//                   options:NSKeyValueObservingOptionNew
//                   context:nil];
}

- (void)dealloc {
    [AESharedResources setListenerOnBusyChanged:nil];
}
//////////////////////////////////////////////////////////////////////////
#pragma mark - ACTIONS

- (IBAction)clickPause:(id)sender {
    DDLogDebugTrace();
    [AESharedResources.sharedDefaults
     setBool:NO
     forKey:AEDefaultsEnabled];
    [AESharedResources synchronizeSharedDefaults];
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
        DDLogDebug(@"Whitelist domains for save:\n%@", mDomains);
        [AESharedResources setWhitelistDomains:mDomains completion:^{
            DDLogDebug(@"Whitelist domains saved");
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
    DDLogDebugTrace();
    if (self.mainAppRunning) {
        [self startProtection];
    }
    else {
        //start app
        [[NSWorkspace sharedWorkspace] launchAppWithBundleIdentifier:AG_BUNDLEID
                                                             options:(NSWorkspaceLaunchWithoutActivation | NSWorkspaceLaunchAndHide)
                                      additionalEventParamDescriptor:nil
                                                    launchIdentifier:NULL];
        [SafariExtensionHandler onReady:^{
            if (! [AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]) {
                [self startProtection];
            }
        }];
    }
}

- (IBAction)clickPreferences:(id)sender {
    if (self.mainAppRunning) {
        [AESharedResources notifyShowPreferences];
    }
    else {
        [[NSWorkspace sharedWorkspace] launchAppWithBundleIdentifier:AG_BUNDLEID
                                                             options:0
                                      additionalEventParamDescriptor:nil
                                                    launchIdentifier:NULL];
        [SafariExtensionHandler onReady:^{
            [AESharedResources notifyShowPreferences];
        }];
    }
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties and Public methods

- (void)setEnabledButton {
    DDLogDebugTrace();
    BOOL showDisabledUI = ! (self.mainAppRunning && [AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]);
    [self setWhitelistButton];
    if (showDisabledUI) {
        self.adguardIcon.image = _disabledLogo;
        if (self.mainAppRunning) {
            self.runAdguardButton.title = NSLocalizedString(@"sae-popover-enabled-button-title", @"Safari App Extension, toolbar popover, title of the button for start protection.");
            self.warningMessageLabel.stringValue = NSLocalizedString(@"sae-popover-enabled-message", @"Safari App Extension, toolbar popover, message text for start protection.");
        }
        else {
            self.runAdguardButton.title = NSLocalizedString(@"sae-popover-run-adguard-button-title", @"Safari App Extension, toolbar popover, title of the button for running AdGuard.");
            self.warningMessageLabel.stringValue = NSLocalizedString(@"sae-popover-run-adguard-message", @"Safari App Extension, toolbar popover, message text for running AdGuard.");
        }
        [self.warningMessageLabel invalidateIntrinsicContentSize];
        [self.view setNeedsUpdateConstraints:YES];
    }
    else {
        self.adguardIcon.image = _enabledLogo;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        self.showDisabledUI = showDisabledUI;
    });
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
        ASSIGN_WEAK(self);
        dispatch_async(dispatch_get_main_queue(), ^{
            ASSIGN_STRONG(self);
            DDLogDebug(@"Whitelist domains:\n%@", domains);
            USE_STRONG(self).whitelistButton.state = ! [USE_STRONG(self) domainCheckWithDomains:domains] ? NSOnState : NSOffState;
        });
    }];
}

- (void)startProtection {
    //start protection
    [AESharedResources.sharedDefaults
     setBool:YES
     forKey:AEDefaultsEnabled];
    [AESharedResources synchronizeSharedDefaults];
    self.busy = YES;
    [AESharedResources notifyDefaultsChanged];
}

- (BOOL)isDark {
    if (@available(macOS 10.14, *)) {
        return [@[NSAppearanceNameDarkAqua, NSAppearanceNameVibrantDark] containsObject:self.view.effectiveAppearance.name];
    }
    return NO;
}
- (void)setAppearance {

    DDLogDebug(@"Current Appearance: %@", NSAppearance.currentAppearance.name);
//    self.view.window.appearance = NSAppearance.currentAppearance;
//    self.view.appearance = NSAppearance.currentAppearance;

    self.whitelistButton.alternateImage = [NSImage imageNamed:@"checkbox-selected"];
    if ([self isDark]) {
        self.whitelistButton.image = [NSImage imageNamed:@"checkbox-dark"];
        _disabledLogo = [NSImage imageNamed:@"logo-gray-dark"];
        _enabledLogo = [NSImage imageNamed:@"logo-green-dark"];
    }
    else {
        self.whitelistButton.image = [NSImage imageNamed:@"checkbox-light"];
        _disabledLogo = [NSImage imageNamed:@"logo-gray"];
        _enabledLogo = [NSImage imageNamed:@"logo-green"];
    }
}

- (void)viewWillLayout {

    [self setAppearance];
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
//    if ([keyPath isEqualToString:@"window"] && [object isEqual:self.view]) {
//        dispatch_async(dispatch_get_main_queue(), ^{
//            [self.view.window addObserver:self
//                               forKeyPath:@"effectiveAppearance"
//                                  options:NSKeyValueObservingOptionNew
//                                  context:nil];
//        });
//        return;
//    }
//
//    else if ([keyPath isEqualToString:@"effectiveAppearance"]) {
//        dispatch_async(dispatch_get_main_queue(), ^{
//            DDLogDebugTrace();
//            [self setAppearance];
//        });
//        return;
//    }
}

@end
