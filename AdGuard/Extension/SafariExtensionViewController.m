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
        sharedController = [[SafariExtensionViewController alloc] init];
    });
    return sharedController;
}

@end
