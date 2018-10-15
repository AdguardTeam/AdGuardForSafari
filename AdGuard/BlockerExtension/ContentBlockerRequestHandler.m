//
//  ContentBlockerRequestHandler.m
//  BlockerExtension
//
//  Created by Roman Sokolov on 29.08.2018.
//  Copyright © 2018 Adguard Software Ltd. All rights reserved.
//

#import "ContentBlockerRequestHandler.h"
#import "AESharedResources.h"

#define AES_BLOCKING_CONTENT_EMPTY_RESOURCE     @"blocking-content-empry"

@interface ContentBlockerRequestHandler ()

@end

@implementation ContentBlockerRequestHandler

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    NSItemProvider *attachment;

    if ([[AESharedResources sharedDefaults] boolForKey:AEDefaultsEnabled]) {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:AESharedResources.blockingContentRulesUrl];
    }
    else {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:[[NSBundle mainBundle] URLForResource:AES_BLOCKING_CONTENT_EMPTY_RESOURCE withExtension:@"json"]];
    }
    if (attachment) {
        NSExtensionItem *item = [[NSExtensionItem alloc] init];
        item.attachments = @[attachment];

        [context completeRequestReturningItems:@[item] completionHandler:nil];
        return;
    }

    [context completeRequestReturningItems:nil completionHandler:nil];
}

@end
