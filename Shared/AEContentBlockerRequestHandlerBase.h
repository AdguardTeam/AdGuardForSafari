//
//  AEContentBlockerRequestHandlerBase.h
//  shared
//
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//
#import <Foundation/Foundation.h>

@interface AEContentBlockerRequestHandlerBase : NSObject <NSExtensionRequestHandling>

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context;

@end
