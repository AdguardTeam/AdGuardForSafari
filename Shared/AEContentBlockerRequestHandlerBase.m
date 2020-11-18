//
//  AEContentBlockerRequestHandlerBase.m
//  shared
//
//  Created by Dimitry Kolyshev on 01.08.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

#import "AEContentBlockerRequestHandlerBase.h"
#import "AESharedResources.h"
#import "CommonLib/ACLang.h"

@interface AEContentBlockerRequestHandlerBase ()

@end

@implementation AEContentBlockerRequestHandlerBase

+ (void)initialize {
    if (self == [AEContentBlockerRequestHandlerBase class]) {
        [AESharedResources initLogger];
        DDLogInfo(@"AG: Initializing extension..");
    }
}

- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    DDLogDebug(@"AG: beginRequestWithExtensionContext..");

    NSItemProvider *attachment;

    if ([[AESharedResources sharedDefaults] boolForKey:AEDefaultsEnabled]) {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:self.blockingContentRulesUrl];
    }
    else {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:self.blockingContentEmptyResourceUrl];
    }
    if (attachment) {
        NSExtensionItem *item = [[NSExtensionItem alloc] init];
        item.attachments = @[attachment];

        DDLogDebug(@"AG: beginRequestWithExtensionContext done.");

        [context completeRequestReturningItems:@[item] completionHandler:nil];
        return;
    }

    [context completeRequestReturningItems:nil completionHandler:nil];
}

- (NSURL *)blockingContentRulesUrl {
    return AESharedResources.blockingContentRulesUrl;
}

- (NSURL *)blockingContentEmptyResourceUrl {
    return AESharedResources.blockingContentRulesEmptyUrl;
}

@end
