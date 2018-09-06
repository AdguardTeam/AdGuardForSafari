/**
    This file is part of Adguard for iOS (https://github.com/AdguardTeam/AdguardForiOS).
    Copyright © Adguard Software Limited. All rights reserved.

    Adguard for iOS is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Adguard for iOS is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Adguard for iOS.  If not, see <http://www.gnu.org/licenses/>.
*/
#import "AESharedResources.h"
#import "CommonLib/ACLang.h"
#import <SafariServices/SafariServices.h>

#define AES_BLOCKING_CONTENT_RULES_RESOURCE     @"blocking-content-rules.json"
#define AES_WHITELIST_DOMAINS                   @"whitelist-domains.txt"
#define AES_USERFILTER_RULES                    @"userfilter-rules.txt"

#define NOTIFICATION_DEFAULTS                   AG_BUNDLEID @".notify.defaults"
#define NOTIFICATION_WHITELIST                  AG_BUNDLEID @".notify.whitelist"
#define NOTIFICATION_USERFILTER                 AG_BUNDLEID @".notify.userfilter"
#define NOTIFICATION_BUSY                       AG_BUNDLEID @".notify.busy"


/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources Constants

NSString * const AEDefaultsEnabled = @"AEDefaultsEnabled";
NSString * const AEDefaultsMainAppBusy = @"AEDefaultsMainAppBusy";

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources

@implementation AESharedResources

static void onChangedNotify(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo);

/////////////////////////////////////////////////////////////////////
#pragma mark Initialize
/////////////////////////////////////////////////////////////////////

static NSURL *_containerFolderUrl;
static NSUserDefaults *_sharedUserDefaults;

static AESListenerBlock _onDefaultsChangedBlock;
static AESListenerBlock _onWhitelistChangedBlock;
static AESListenerBlock _onUserFilterChangedBlock;
static AESListenerBlock _onBusyChangedBlock;

+ (void)initialize{
    
    if (self == [AESharedResources class]) {
        
        _containerFolderUrl = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:AG_GROUP];
        _sharedUserDefaults = [[NSUserDefaults alloc] initWithSuiteName:AG_GROUP];

        // Registering standart Defaults
        NSDictionary * defs = [NSDictionary dictionaryWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"defaults" ofType:@"plist"]];
        if (defs)
        [_sharedUserDefaults registerDefaults:defs];

        _onDefaultsChangedBlock = NULL;
        _onWhitelistChangedBlock = NULL;
        _onUserFilterChangedBlock = NULL;
    }
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods
/////////////////////////////////////////////////////////////////////

+ (NSURL *)sharedResuorcesURL{
    
    return _containerFolderUrl;
}

+ (NSURL *)sharedAppLogsURL{

    NSString *ident = [[NSBundle bundleForClass:[self class]] bundleIdentifier];

    NSURL *logsUrl = [AESharedResources sharedLogsURL];
    if (ident) {
        logsUrl = [logsUrl URLByAppendingPathComponent:ident];
    }

    return logsUrl;
}

+ (NSURL *)sharedLogsURL{

    return [_containerFolderUrl URLByAppendingPathComponent:@"Logs"];
}


+ (NSString *)blockerBundleId {
    return AG_BLOCKER_BUNDLEID;
}

+ (NSString *)extensionBundleId {
    return AG_EXTENSION_BUNDLEID;
}

+ (void)initLogger {
    [[ACLLogger singleton] initLogger:[AESharedResources sharedAppLogsURL]];
#if DEBUG
    [[ACLLogger singleton] setLogLevel:ACLLVerboseLevel];
#endif

}

+ (NSUserDefaults *)sharedDefaults{

    return _sharedUserDefaults;
}

+ (void)synchronizeSharedDefaults{

    [_sharedUserDefaults synchronize];
}

+ (void)notifyDefaultsChanged {
    CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_DEFAULTS, NULL, NULL, YES);
}
+ (void)setListenerOnDefaultsChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_DEFAULTS
                            blockPtr:&_onDefaultsChangedBlock
                               block:block];
}

+ (void)notifyWhitelistChanged {
    CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_WHITELIST, NULL, NULL, YES);
}
+ (void)setListenerOnWhitelistChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_WHITELIST
                            blockPtr:&_onWhitelistChangedBlock
                               block:block];
}

+ (void)notifyUserFilterChanged {
    CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_USERFILTER, NULL, NULL, YES);
}
+ (void)setListenerOnUserFilterChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_USERFILTER
                            blockPtr:&_onUserFilterChangedBlock
                               block:block];
}

+ (void)notifyBusyChanged {
    CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_BUSY, NULL, NULL, YES);
}
+ (void)setListenerOnBusyChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_BUSY
                            blockPtr:&_onBusyChangedBlock
                               block:block];
}

+ (void)setBlockingContentRulesJson:(NSData *)jsonData completion:(void (^)(void))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            NSData *data = jsonData ?: [NSData data];
            [self saveData:data toFileRelativePath:AES_BLOCKING_CONTENT_RULES_RESOURCE];
            if (completion) {
                completion();
            }
        }
    });
}

+ (NSURL *)blockingContentRulesUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_RESOURCE];
}

+ (void)setWhitelistDomains:(NSArray <NSString *> *)domains completion:(void (^)(void))completion {

    [self saveObject:domains key:AES_WHITELIST_DOMAINS completion:completion];
}

+ (void)whitelistDomainsWithCompletion:(void (^)(NSArray <NSString *> *domains))completion {

    [self loadObjectWithKey:AES_WHITELIST_DOMAINS completion:completion];
}

+ (void)setUserFilterRules:(NSArray <NSString *> *)rules completion:(void (^)(void))completion {

    [self saveObject:rules key:AES_USERFILTER_RULES completion:completion];
}

+ (void)userFilterRulesWithCompletion:(void (^)(NSArray <NSString *> *rules))completion {

    [self loadObjectWithKey:AES_USERFILTER_RULES completion:completion];
}

/////////////////////////////////////////////////////////////////////
#pragma mark Helper methods (private)

+ (void)setListenerForNotification:(NSString *)notificationName
                          blockPtr:(__strong AESListenerBlock *)blockPtr
                             block:(AESListenerBlock)block {
    if (*blockPtr) {
        //Observer was registered
        if (! block) {
            //unregister observer
            CFNotificationCenterRemoveObserver(CFNotificationCenterGetDarwinNotifyCenter(),
                                               (__bridge const void *)(self),
                                               (CFStringRef)notificationName,
                                               NULL);
        }
    }
    else if (block) {
        //Register observer

        CFNotificationCenterAddObserver(CFNotificationCenterGetDarwinNotifyCenter(),
                                        (__bridge const void *)(self),
                                        &onChangedNotify,
                                        (CFStringRef)notificationName,
                                        NULL,
                                        CFNotificationSuspensionBehaviorDeliverImmediately);
    }
    *blockPtr = block;
}

/////////////////////////////////////////////////////////////////////
#pragma mark Storage methods (private)


+ (NSData *)loadDataFromFileRelativePath:(NSString *)relativePath{
    
    if (!relativePath) {
        [[NSException argumentException:@"relativePath"] raise];
    }
    
    @autoreleasepool {
        if (_containerFolderUrl) {
            
            NSURL *dataUrl = [_containerFolderUrl URLByAppendingPathComponent:relativePath];
            if (dataUrl) {
                ACLFileLocker *locker = [[ACLFileLocker alloc] initWithPath:[dataUrl path]];
                if ([locker lock]) {
                    
                    NSData *data = [NSData dataWithContentsOfURL:dataUrl];
                    
                    [locker unlock];
                    
                    return data;
                }
            }
        }
        
        return nil;
    }
}

+ (BOOL)saveData:(NSData *)data toFileRelativePath:(NSString *)relativePath{

    if (!(data && relativePath)) {
        [[NSException argumentException:@"data/relativePath"] raise];
    }
    
    @autoreleasepool {
        if (_containerFolderUrl) {
            
            NSURL *dataUrl = [_containerFolderUrl URLByAppendingPathComponent:relativePath];
            if (dataUrl) {
                ACLFileLocker *locker = [[ACLFileLocker alloc] initWithPath:[dataUrl path]];
                if ([locker lock]) {
                    
                    BOOL result = [data writeToURL:dataUrl atomically:YES];
                    
                    [locker unlock];
                    
                    return result;
                }
            }
        }
        
        return NO;;
    }
}

+ (void)saveObject:(id)obj key:(NSString *)key completion:(void (^)(void))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            if (obj == nil) {
                [self saveData:[NSData data] toFileRelativePath:key];
            }
            else {

                NSData *data = [NSKeyedArchiver archivedDataWithRootObject:obj];
                if (!data) {
                    data = [NSData data];
                }

                [self saveData:data toFileRelativePath:key];
            }
            if (completion) {
                completion();
            }
        }
    });
}

+ (void)loadObjectWithKey:(NSString *)key completion:(void (^)(id obj))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            NSData *data = [self loadDataFromFileRelativePath:key];
            id result = nil;
            if (data.length) {
                result = [NSKeyedUnarchiver unarchiveObjectWithData:data];
            }
            if (completion) {
                completion(result);
            }
        }
    });
}

- (NSString*) pathForRelativePath:(NSString*) relativePath {
    
    NSURL *dataUrl = [_containerFolderUrl URLByAppendingPathComponent:relativePath];
    
    return dataUrl.path;
}

/////////////////////////////////////////////////////////////////////
#pragma mark Darwin notofication callbacks (private)

static void onChangedNotify(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo) {
    NSString *nName = (__bridge NSString *)name;
    AESListenerBlock block = nil;
    if ([nName isEqualToString:NOTIFICATION_DEFAULTS]) {
        block = _onDefaultsChangedBlock;
    }
    else if ([nName isEqualToString:NOTIFICATION_WHITELIST]){
        block = _onWhitelistChangedBlock;
    }
    else if ([nName isEqualToString:NOTIFICATION_USERFILTER]){
        block = _onUserFilterChangedBlock;
    }

    if (block) {
        block();
    }
}

@end

