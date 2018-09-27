//
//  SafariExtensionViewController.h
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import <SafariServices/SafariServices.h>
@import AppKit;
@import Cocoa;

@interface SafariExtensionViewController : SFSafariExtensionViewController

+ (SafariExtensionViewController *)sharedController;

//////////////////////////////////////////////////////////////////////////
#pragma mark - OUTLETS

@property (weak) IBOutlet NSImageView *adguardIcon;
@property (weak) IBOutlet NSButton *whitelistButton;
@property (weak) IBOutlet NSButton *assistantButton;
@property (weak) IBOutlet NSTextField *warningMessageLabel;
@property (weak) IBOutlet NSButton *runAdguardButton;

//////////////////////////////////////////////////////////////////////////
#pragma mark - ACTIONS

- (IBAction)clickPause:(id)sender;
- (IBAction)clickWhitelist:(id)sender;
- (IBAction)clickAssistant:(id)sender;
- (IBAction)clickRunAdguard:(id)sender;
- (IBAction)clickPreferences:(id)sender;

//////////////////////////////////////////////////////////////////////////
#pragma mark - Properties and Public methods

@property NSString *domain;
@property BOOL busy;
@property (nonatomic) BOOL mainAppRunning;
@property (readonly) BOOL showDisabledUI;

- (void)setEnabledButton;

@end
