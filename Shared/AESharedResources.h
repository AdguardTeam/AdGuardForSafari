//
//  AESharedResources.h
//  AdGuard
//
//  Created by Roman Sokolov on 20.08.2018.
//  Copyright © 2018 Adguard Software Ltd. All rights reserved.
//
#import <Foundation/Foundation.h>

typedef void (^AESListenerBlock)(void);

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources Constants

extern NSString * const AEDefaultsEnabled;
extern NSString * const AEDefaultsMainAppBusy;
extern NSString * const AEDefaultsLastReportUrl;

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources

/**
     Class, which provides exchanging data between app and extension.
 */
@interface AESharedResources : NSObject

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods

/**
 Returns URL where is shared resources.
 */
@property (class, readonly) NSURL *sharedResuorcesURL;
/**
 Returns URL where must be current application logs.
 */
@property (class, readonly) NSURL *sharedAppLogsURL;

/**
 Returns URL where must be the applications logs.
 */
@property (class, readonly) NSURL *sharedLogsURL;
/**
 Returns shared user defaults object.
 */
@property (class, readonly) NSUserDefaults *sharedDefaults;
/**
 BundleId of the content blocker extension.
 */
@property (class, readonly) NSString *blockerBundleId;
/**
 Bundle id of the Safari app extension.
 */
@property (class, readonly) NSString *extensionBundleId;

/**
 Initializes logger. After that we may use log macros.
 */
+ (void)initLogger;
/**
 Performs flush of the shared user defaults.
 */
+ (void)synchronizeSharedDefaults;

/**
 Notifies all, that a user defaults was changed, like that - AEDefaultsEnabled.
 */
+ (void)notifyDefaultsChanged;
/**
 Register listener for changing a user defaults.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnDefaultsChanged:(AESListenerBlock)block;

/**
 Notifies all, that the whitelist was changed.
 */
+ (void)notifyWhitelistChanged;
/**
 Register listener for changing the whitelist.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnWhitelistChanged:(AESListenerBlock)block;

/**
 Notifies all, that the user filter rules was changed.
 */
+ (void)notifyUserFilterChanged;
/**
 Register listener for changing the user filter rules.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnUserFilterChanged:(AESListenerBlock)block;

/**
 Notifies all, that the busy status was changed.
 */
+ (void)notifyBusyChanged;
/**
 Register listener for changing the busy status.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnBusyChanged:(AESListenerBlock)block;
/**
 Notifies, that user wants to see the prerefences window.
 */
+ (void)notifyShowPreferences;
/**
 Register listener for show preferences.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnShowPreferences:(AESListenerBlock)block;
/**
 Notifies others, that main app successfully launched.
 */
+ (void)notifyReady;
/**
 Register listener for main app ready.

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnReady:(AESListenerBlock)block;
/**
 Notifies, that user wants to "Report this site".
 */
+ (void)notifyReport;
/**
 Register listener for "Report this site".

 @param block Performed on internal thread when catched notification.
 */
+ (void)setListenerOnReport:(AESListenerBlock)block;

/**
 Saves blocking content rules JSON in shared storage.
 Completion is executed on global concurent queue.

 @param jsonData Rules json, may be nil.
 @param completion May be nil.
 */
+ (void)setBlockingContentRulesJson:(NSData *)jsonData completion:(void (^)(void))completion;
/**
 Saves advanced blocking content rules JSON in shared storage.
 Completion is executed on global concurent queue.

 @param jsonData Rules json, may be nil.
 @param completion May be nil.
 */
+ (void)setAdvancedBlockingContentRulesJson:(NSData *)jsonData completion:(void (^)(void))completion;
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
