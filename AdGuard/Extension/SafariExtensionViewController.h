//
//  SafariExtensionViewController.h
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import <SafariServices/SafariServices.h>

@interface SafariExtensionViewController : SFSafariExtensionViewController

+ (SafariExtensionViewController *)sharedController;

@end
