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
        [AESharedResources initLogger];
        sharedController = [[SafariExtensionViewController alloc] initWithNibName:nil bundle:nil];
    });
    return sharedController;
}

- (void)viewDidLoad {

    DDLogDebugTrace();
    self.view.appearance = NSAppearance.currentAppearance;

    [AESharedResources setListenerOnDefaultsChanged:^{
        DDLogDebugTrace();
        [self setEnabledButton];
        [self setAssistantButton];
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
        NSMutableArray *mDomains = [domains mutableCopy];
        if ([mDomains containsObject:domain]) {
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
    [AESharedResources.sharedDefaults
     setBool:! [AESharedResources.sharedDefaults boolForKey:AEDefaultsAssistantEnabled]
     forKey:AEDefaultsAssistantEnabled];
    [AESharedResources notifyDefaultsChanged];
}

//////////////////////////////////////////////////////////////////////////
#pragma mark - Private methods

- (void)setEnabledButton {
    DDLogDebugTrace();
    if ([AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]) {
        self.enabledButton.state = NSOnState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Enabled\" state.");
    }
    else {
        self.enabledButton.state = NSOffState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-enabled-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard filtering, \"Disabled\" state.");
    }
}
- (void)setWhitelistButton {

    [AESharedResources whitelistDomainsWithCompletion:^(NSArray<NSString *> *domains) {
        DDLogDebugTrace();
        if (self.domain.length && [domains containsObject:self.domain]) {
            self.enabledButton.state = NSOffState;
            self.enabledButton.title = NSLocalizedString(@"sae-popover-filter-this-site-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off filtration on this site, \"Off\" state.");
        }
        else {
            self.enabledButton.state = NSOnState;
            self.enabledButton.title = NSLocalizedString(@"sae-popover-filter-this-site-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off filtration on this site, \"On\" state.");
        }

    }];
}
- (void)setAssistantButton {

    DDLogDebugTrace();
    if ([AESharedResources.sharedDefaults boolForKey:AEDefaultsAssistantEnabled]) {
        self.enabledButton.state = NSOnState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-assistant-button-on", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard Assistant, \"On\" state.");
    }
    else {
        self.enabledButton.state = NSOffState;
        self.enabledButton.title = NSLocalizedString(@"sae-popover-assistant-button-off", @"Safari App Extension, toolbar popover, title of the button for on/off AdGuard Assistant, \"Off\" state.");
    }
}

@end
