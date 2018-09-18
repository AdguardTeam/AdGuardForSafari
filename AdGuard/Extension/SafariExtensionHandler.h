//
//  SafariExtensionHandler.h
//  Extension
//
//  Created by Roman Sokolov on 15.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import <SafariServices/SafariServices.h>

@interface SafariExtensionHandler : SFSafariExtensionHandler

/**
 Performs block if Main App is ready.
 If not, sends block to queue, which will be processed when main app send "Ready" notification.

 Blocks performs on main thread asynchronously.

 @param block Block of a code.
 */
+ (void)onReady:(dispatch_block_t)block;

@end
