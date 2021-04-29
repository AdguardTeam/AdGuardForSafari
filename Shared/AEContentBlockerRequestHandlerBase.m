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
    DDLogInfo(@"AG: beginRequestWithExtensionContext..");

    NSItemProvider *attachment;

    if ([[AESharedResources sharedDefaults] boolForKey:AEDefaultsEnabled]) {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:self.blockingContentRulesUrl];
        DDLogInfo(@"AG: beginRequestWithExtensionContext obtained content.");
    }
    else {
        attachment = [[NSItemProvider alloc] initWithContentsOfURL:self.blockingContentEmptyResourceUrl];
        DDLogInfo(@"AG: beginRequestWithExtensionContext empty content.");
    }
    if (attachment) {
        NSExtensionItem *item = [[NSExtensionItem alloc] init];
        item.attachments = @[attachment];

        DDLogInfo(@"AG: beginRequestWithExtensionContext done.");

        [context completeRequestReturningItems:@[item] completionHandler:nil];
        return;
    }

    DDLogInfo(@"AG: beginRequestWithExtensionContext done with error.");
    [context completeRequestReturningItems:nil completionHandler:nil];
}

- (NSURL *)blockingContentRulesUrl {
    return AESharedResources.blockingContentRulesUrl;
}

- (NSURL *)blockingContentEmptyResourceUrl {
    return AESharedResources.blockingContentRulesEmptyUrl;
}

@end
