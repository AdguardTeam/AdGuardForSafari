//
//  SafariExtensionViewController.m
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Adguard Software Ltd. All rights reserved.
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
    SFSafariPage *_pageForReload;
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

    _disabledLogo = [NSImage imageNamed:@"logo-gray"];
    _enabledLogo = [NSImage imageNamed:@"logo-green"];
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

- (IBAction)clickAllowlist:(id)sender {
    NSString *domain = self.currentPageUrl.host;
    if (domain.length == 0) {
        return;
    }
    self.busy = YES;
    [AESharedResources allowlistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        DDLogDebugTrace();
        NSMutableArray *mDomains = [domains mutableCopy] ?: [NSMutableArray new];
        if ([self domainCheckWithDomains:mDomains]) {
            [mDomains removeObject:domain];
        }
        else {
            [mDomains addObject:domain];
        }
        DDLogDebug(@"Allowlist domains for save:\n%@", mDomains);
        [AESharedResources setAllowlistDomains:mDomains completion:^{
            DDLogDebug(@"Allowlist domains saved");
            [self setCurrentPageNeedReload];
            [AESharedResources notifyAllowlistChanged];
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
        //start app in background
        NSURL * appURL = [[NSWorkspace sharedWorkspace] URLForApplicationWithBundleIdentifier:AG_BUNDLEID];
        if (appURL == nil) {
            DDLogError(@"Can't obtain URL for Main App.");
        }
        else {
            NSURL *urlToOpen = [NSURL URLWithString:@"agsafari://launchInBackground"];
            
            NSError *error = nil;
            [NSWorkspace.sharedWorkspace openURLs:@[urlToOpen]
                             withApplicationAtURL:appURL
                                          options:0
                                    configuration:@{}
                                            error:&error];
            
            if (error) {
                DDLogError(@"An error occurred: %@", error.localizedDescription);
            } else {
                DDLogDebug(@"Main app successfully launched");
            }
        }
        
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

- (IBAction)clickReport:(id)sender {
    NSString *urlString = self.currentPageUrl.absoluteString;
    if (@available(macOS 10.14.4, *)) {
        [SafariExtensionViewController.sharedController dismissPopover];
    }
    if (urlString.length) {
        [[AESharedResources sharedDefaults] setObject:urlString forKey:AEDefaultsLastReportUrl];
        [AESharedResources notifyReport];
    }
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties and Public methods

- (void)setEnabledButton {
    DDLogDebugTrace();
    BOOL showDisabledUI = ! (self.mainAppRunning && [AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]);
    [self setAllowlistButton];
    if (showDisabledUI) {
        self.adguardIcon.image = _disabledLogo;
        if (self.mainAppRunning) {
            self.runAdguardButton.title = NSLocalizedString(@"sae-popover-enabled-button-title", @"Safari App Extension, toolbar popover, title of the button for start protection.");
            self.warningMessageLabel.stringValue = NSLocalizedString(@"sae-popover-enabled-message", @"Safari App Extension, toolbar popover, message text for start protection.");
            self.warningMessageDescription.stringValue = @"";
        }
        else {
            self.runAdguardButton.title = NSLocalizedString(@"sae-popover-run-adguard-button-title", @"Safari App Extension, toolbar popover, title of the button for running AdGuard.");
            self.warningMessageLabel.stringValue = NSLocalizedString(@"sae-popover-run-adguard-message", @"Safari App Extension, toolbar popover, message text for running AdGuard.");
            self.warningMessageDescription.stringValue = NSLocalizedString(@"sae-popover-run-adguard-description", @"Safari App Extension, toolbar popover, description text for running AdGuard.");
        }
        [self.warningMessageLabel invalidateIntrinsicContentSize];
        [self.warningMessageDescription invalidateIntrinsicContentSize];
        [self.view setNeedsUpdateConstraints:YES];
    }
    else {
        self.adguardIcon.image = _enabledLogo;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        self.showDisabledUI = showDisabledUI;
    });
}

- (void)reloadPage {
    [self->_pageForReload reload];
    self->_pageForReload = nil;
}

- (BOOL)domainCheckWithDomains:(NSArray <NSString *> *)domains {
    NSString *theDomain = self.currentPageUrl.host;
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

//////////////////////////////////////////////////////////////////////////
#pragma mark - Private methods

- (void)setAllowlistButton {

    [AESharedResources allowlistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        ASSIGN_WEAK(self);
        dispatch_async(dispatch_get_main_queue(), ^{
            ASSIGN_STRONG(self);
            DDLogDebug(@"Allowlist domains:\n%@", domains);
            BOOL inAllowlist = [USE_STRONG(self) domainCheckWithDomains:domains];
            BOOL allowlistInverted = [[AESharedResources sharedDefaults] boolForKey:AEDefaultsAllowlistInverted];
            BOOL enabledForDomain = allowlistInverted ? inAllowlist : !inAllowlist;
            USE_STRONG(self).allowlistButton.state = enabledForDomain ? NSOnState : NSOffState;
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

- (void)setCurrentPageNeedReload {
        DDLogDebugTrace();
        //Launch script for select element on web page
        [SFSafariApplication getActiveWindowWithCompletionHandler:^(SFSafariWindow * _Nullable activeWindow) {
            [activeWindow getActiveTabWithCompletionHandler:^(SFSafariTab * _Nullable activeTab) {
                [activeTab getActivePageWithCompletionHandler:^(SFSafariPage * _Nullable activePage) {
                    self->_pageForReload = activePage;
                }];
            }];
        }];
}

- (BOOL)isDark {
    if (@available(macOS 10.14, *)) {
        return [@[NSAppearanceNameDarkAqua, NSAppearanceNameVibrantDark] containsObject:self.view.effectiveAppearance.name];
    }
    return NO;
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
