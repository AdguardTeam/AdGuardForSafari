//
//  ContentBlockerRequestHandler.m
//
//  Created by Dimitry Kolyshev on 25.07.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

#import "ContentBlockerRequestHandler.h"
#import "AESharedResources.h"

@implementation ContentBlockerRequestHandler

- (NSURL *)blockingContentRulesUrl {
    return AESharedResources.blockingContentSocialUrl;
}

@end
