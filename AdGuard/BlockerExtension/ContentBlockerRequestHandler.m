//
//  ContentBlockerRequestHandler.m
//  BlockerExtension
//
//  Created by Roman Sokolov on 29.08.2018.
//  Copyright © 2018 Adguard Software Ltd. All rights reserved.
//

#import "ContentBlockerRequestHandler.h"
#import "AESharedResources.h"

@implementation ContentBlockerRequestHandler

- (NSURL *)blockingContentRulesUrl {
    return AESharedResources.blockingContentRulesUrl;
}

@end
