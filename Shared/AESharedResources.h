//
//  AESharedResources.h
//  AdGuard
//
//  Created by Roman Sokolov on 20.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//
#import <Foundation/Foundation.h>

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources Constants
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources
/////////////////////////////////////////////////////////////////////

/**
     Class, which provides exchanging data between app and extension.
 */
@interface AESharedResources : NSObject

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods
/////////////////////////////////////////////////////////////////////

/**
 Returns URL where is shared resources.
 */
+ (NSURL *)sharedResuorcesURL;

/**
 Returns shared user defaults object.
 */
@property (class, readonly) NSUserDefaults *sharedDefaults;
/**
 Performs flush of the shared user defaults.
 */
+ (void)synchronizeSharedDefaults;

+ (void)notifyDefaultsChanged;
+ (void)setListenerOnDefaultsChanged:(void (^)(void))block;

+ (void)notifyWhitelistChanged;
+ (void)setListenerOnWhitelistChanged:(void (^)(void))block;

+ (void)notifyUserFilterChanged;
+ (void)setListenerOnUserFilterChanged:(void (^)(void))block;

/**
 Saves blocking content rules JSON in shared storage.
 Completion is executed on global concurent queue.

 @param jsonData Rules json, may be nil.
 @param completion May be nil.
 */
+ (void)setBlockingContentRulesJson:(NSData *)jsonData completion:(void (^)(void))completion;
/**
 Gets URL of the blocking content rules JSON from shared storage.
 */
+ (NSURL *)blockingContentRulesUrl;
/**
 Saves the whitelist domains in shared storage.
 Completion is executed on global concurent queue.

 @param domains List of the domains, may be nil.
 @param completion May be nil.
 */
+ (void)setWhitelistDomains:(NSArray <NSString *> *)domains completion:(void (^)(void))completion;
/**
 Gets the whitelist domains from shared storage.
 Completion is executed on global concurent queue.
 */
+ (void)whitelistDomainsWithCompletion:(void (^)(NSArray <NSString *> *domains))completion;
/**
 Saves the user filter rules in shared storage.
 Completion is executed on global concurent queue.

 @param rules List of the rule, may be nil.
 @param completion May be nil.
 */
+ (void)setUserFilterRules:(NSArray <NSString *> *)rules completion:(void (^)(void))completion;
/**
 Gets the user filter rules from shared storage.
 Completion is executed on global concurent queue.
 */
+ (void)userFilterRulesWithCompletion:(void (^)(NSArray <NSString *> *rules))completion;

@end
