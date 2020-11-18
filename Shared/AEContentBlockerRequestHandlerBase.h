//
//  AEContentBlockerRequestHandlerBase.h
//  shared
//
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//
#import <Foundation/Foundation.h>

@interface AEContentBlockerRequestHandlerBase : NSObject <NSExtensionRequestHandling>

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context;

@end
