//
//  ContentBlockerRequestHandler.m
//  BlockerSecurityExtension
//
//  Created by Dimitry Kolyshev on 05.08.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

#import "ContentBlockerRequestHandler.h"
#import "AESharedResources.h"

@implementation ContentBlockerRequestHandler

- (NSURL *)blockingContentRulesUrl {
    
    return AESharedResources.blockingContentSecurityUrl;
}

@end

