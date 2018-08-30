//
//  ContentBlockerRequestHandler.m
//  BlockerExtension
//
//  Created by Roman Sokolov on 29.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "ContentBlockerRequestHandler.h"
#import "AESharedResources.h"

#define AES_BLOCKING_CONTENT_EMPTY_RESOURCE     @"blocking-content-empry"

@interface ContentBlockerRequestHandler ()

@end

@implementation ContentBlockerRequestHandler

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    NSItemProvider *attachment = [[NSItemProvider alloc] initWithContentsOfURL:[[NSBundle mainBundle] URLForResource:AES_BLOCKING_CONTENT_EMPTY_RESOURCE withExtension:@"json"]];
    
    NSExtensionItem *item = [[NSExtensionItem alloc] init];
    item.attachments = @[attachment];
    
    [context completeRequestReturningItems:@[item] completionHandler:nil];
}

@end
