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

    [self setEnabledButton];
    [self setWhitelistButton];
    [AESharedResources setListenerOnDefaultsChanged:^{
        DDLogDebugTrace();
        [self setEnabledButton];
    }];
    [AESharedResources setListenerOnWhitelistChanged:^{
        DDLogDebugTrace();
        [self setWhitelistButton];
    }];
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - ACTIONS

- (IBAction)clickEnabled:(id)sender {
    DDLogDebugTrace();
    [AESharedResources.sharedDefaults
     setBool:! [AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]
     forKey:AEDefaultsEnabled];
    [AESharedResources notifyDefaultsChanged];
}

- (IBAction)clickWhitelist:(id)sender {
    NSString *domain = self.domain;
    if (domain.length == 0) {
        return;
    }
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
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties and Public methods

- (void)setWhitelistButton {

    [AESharedResources whitelistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        DDLogDebugTrace();
        [self setWhitelistButtonOn:! [self domainCheckWithDomains:domains]];
    }];
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Private methods

- (void)setEnabledButton {
    DDLogDebugTrace();
    if ([AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]) {
        self.enabledButton.state = NSOnState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Enabled\" state.");
        [self setButtonsEnabled:YES];
    }
    else {
        self.enabledButton.state = NSOffState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Disabled\" state.");
        [self setButtonsEnabled:NO];
    }
}

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
- (void)setButtonsEnabled:(BOOL)enabled {

    self.assistantButton.enabled = enabled;
    self.whitelistButton.enabled = enabled;
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
@end
