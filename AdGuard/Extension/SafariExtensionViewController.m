//
//  SafariExtensionViewController.m
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "SafariExtensionViewController.h"

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

- (IBAction)clickButton:(id)sender {

    NSLog(@"Func: %s", __FUNCTION__);
}

- (void)viewDidLoad {
    
    NSLog(@"Func: %s\n AfectiveAp: %@, CurAp: %@", __FUNCTION__, self.view.effectiveAppearance.name, NSAppearance.currentAppearance.name);

    self.view.appearance = NSAppearance.currentAppearance;
}

@end
