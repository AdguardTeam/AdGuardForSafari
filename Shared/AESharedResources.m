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

#define AES_BLOCKING_CONTENT_EMPTY_RESOURCE     @"blocker-content-rules-empty.json"
#define AES_BLOCKING_CONTENT_RULES_RESOURCE     @"blocking-content-rules.json"
#define AES_BLOCKING_CONTENT_RULES_PRIVACY_RESOURCE     @"blocking-content-rules-privacy.json"
#define AES_BLOCKING_CONTENT_RULES_SECURITY_RESOURCE     @"blocking-content-rules-security.json"
#define AES_BLOCKING_CONTENT_RULES_SOCIAL_RESOURCE     @"blocking-content-rules-social.json"
#define AES_BLOCKING_CONTENT_RULES_OTHER_RESOURCE     @"blocking-content-rules-other.json"
#define AES_BLOCKING_CONTENT_RULES_CUSTOM_RESOURCE     @"blocking-content-rules-custom.json"
#define AES_ADV_BLOCKING_CONTENT_RULES_RESOURCE @"adv-blocking-content-rules.json"
#define AES_ALLOWLIST_DOMAINS                   @"allowlist-domains.data"
#define AES_USERFILTER_RULES                    @"userfilter-rules.data"
#define AES_CUSTOM_FILTER_INFO                  @"custom-filter-info.data"

#define NOTIFICATION_DEFAULTS                   AG_BUNDLEID @".notify.defaults"
#define NOTIFICATION_ALLOWLIST                  AG_BUNDLEID @".notify.allowlist"
#define NOTIFICATION_USERFILTER                 AG_BUNDLEID @".notify.userfilter"
#define NOTIFICATION_BUSY                       AG_BUNDLEID @".notify.busy"
#define NOTIFICATION_VERBOSE_LOGGING            AG_BUNDLEID @".notify.verbose"
#define NOTIFICATION_SHOW_PREFS                 AG_BUNDLEID @".notify.showprefs"
#define NOTIFICATION_READY                      AG_BUNDLEID @".notify.ready"
#define NOTIFICATION_REPORT                     AG_BUNDLEID @".notify.report"
#define NOTIFICATION_ADVANCED_BLOCKING          AG_BUNDLEID @".notify.advancedblocking"
#define NOTIFICATION_CUSTOM_FILTER_INFO_SET     AG_BUNDLEID @".notify.customfilterinfoset"

#define NOTIFICATION_EXTENSIONS_ENABLED         AG_BUNDLEID @".notify.allExtentionsEnabled"
#define REQUEST_EXTENSIONS_ENABLED              AG_BUNDLEID @".request.allExtentionsEnabled"

#define ADC_PROCESS_DEFAULT_BUNDLE_ID           @"com.apple.Safari"

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources Constants

NSString * const AEDefaultsEnabled = @"AEDefaultsEnabled";
NSString * const AEDefaultsMainAppBusy = @"AEDefaultsMainAppBusy";
NSString * const AEDefaultsVerboseLogging = @"AEDefaultsVerboseLogging";
NSString * const AEDefaultsLastReportUrl = @"AEDefaultsLastReportUrl";
NSString * const AEDefaultsAllExtensionsEnabled = @"AEDefaultsAllExtensionsEnabled";
NSString * const AEDefaultsAllowlistInverted = @"AEDefaultsAllowlistInverted";

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources

@implementation AESharedResources

static void onChangedNotify(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo);

/////////////////////////////////////////////////////////////////////
#pragma mark Initialize
/////////////////////////////////////////////////////////////////////

static NSURL *_containerFolderUrl;
static NSUserDefaults *_sharedUserDefaults;

static NSMutableDictionary<NSString *, AESListenerBlock> *ListenerHolder;

//internal processed blocks
static AESListenerBlock _onAllExtensionEnabledRequestBlock;

+ (void)initialize{

    if (self == [AESharedResources class]) {

        DDLogInfo(@"Initializing AESharedResources");

        ListenerHolder = [NSMutableDictionary new];
        _containerFolderUrl = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:AG_GROUP];
        _sharedUserDefaults = [[NSUserDefaults alloc] initWithSuiteName:AG_GROUP];

        // Registering standard Defaults
        NSDictionary * defs = [NSDictionary dictionaryWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"defaults" ofType:@"plist"]];
        if (defs)
        [_sharedUserDefaults registerDefaults:defs];

        DDLogInfo(@"Initializing AESharedResources - ok");
    }
}

/////////////////////////////////////////////////////////////////////
#pragma mark   Events (public methods)

+ (NSURL *)sharedResourcesURL{

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


+ (NSString *)extensionBundleId {
    return AG_EXTENSION_BUNDLEID;
}

+ (NSString *)advancedBlockingBundleId {
    return AG_ADVANCED_BLOCKING_BUNDLEID;
}
+ (NSString *)blockerBundleId {
    return AG_BLOCKER_BUNDLEID;
}
+ (NSString *)blockerPrivacyBundleId{
    return AG_BLOCKER_PRIVACY_BUNDLEID;
}
+ (NSString *)blockerSecurityBundleId{
    return AG_BLOCKER_SECURITY_BUNDLEID;
}
+ (NSString *)blockerSocialBundleId{
    return AG_BLOCKER_SOCIAL_BUNDLEID;
}
+ (NSString *)blockerOtherBundleId{
    return AG_BLOCKER_OTHER_BUNDLEID;
}
+ (NSString *)blockerCustomBundleId{
    return AG_BLOCKER_CUSTOM_BUNDLEID;
}
+ (NSString *)safariVersion{
    NSURL *path = [[NSWorkspace sharedWorkspace] URLForApplicationWithBundleIdentifier:ADC_PROCESS_DEFAULT_BUNDLE_ID];
    NSBundle *bundle = [NSBundle bundleWithPath:path.path];
    return [bundle.infoDictionary objectForKey:@"CFBundleShortVersionString"];
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

+ (void)requestAllExtensionEnabled {
    DDLogInfo(@"AG: requestAllExtensionEnabled");

    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)REQUEST_EXTENSIONS_ENABLED, NULL, NULL, YES);
    });
}
+ (void)setListenerOnAllExtensionEnabledRequest:(AESListenerBlock)block {
    [self setListenerForNotification:REQUEST_EXTENSIONS_ENABLED
                               block:block];
}
+ (void)responseAllExtensionEnabled {
    DDLogInfo(@"AG: responseAllExtensionEnabled");

    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_EXTENSIONS_ENABLED, NULL, NULL, YES);
    });
}
+ (void)setListenerOnAllExtensionEnabledResponse:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_EXTENSIONS_ENABLED
                               block:block];
}

+ (void)notifyDefaultsChanged {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_DEFAULTS, NULL, NULL, YES);
    });
}
+ (void)setListenerOnDefaultsChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_DEFAULTS
                               block:block];
}

+ (void)notifyAllowlistChanged {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_ALLOWLIST, NULL, NULL, YES);
    });
}
+ (void)setListenerOnAllowlistChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_ALLOWLIST
                               block:block];
}

+ (void)notifyUserFilterChanged {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_USERFILTER, NULL, NULL, YES);
    });
}
+ (void)setListenerOnUserFilterChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_USERFILTER
                               block:block];
}
+ (void)notifyCustomFilterInfoSet {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef) NOTIFICATION_CUSTOM_FILTER_INFO_SET, NULL, NULL, YES);
    });
}
+ (void)setListenerOnCustomFilterInfoSet:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_CUSTOM_FILTER_INFO_SET
                               block:block];
}

+ (void)notifyShowPreferences {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_SHOW_PREFS, NULL, NULL, YES);
    });
}

+ (void)setListenerOnShowPreferences:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_SHOW_PREFS
                               block:block];
}

+ (void)notifyReady {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_READY, NULL, NULL, YES);
    });
}
+ (void)setListenerOnReady:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_READY
                               block:block];
}

+ (void)notifyBusyChanged {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_BUSY, NULL, NULL, YES);
    });
}
+ (void)setListenerOnBusyChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_BUSY
                               block:block];
}

+ (void)notifyVerboseLoggingChanged {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_VERBOSE_LOGGING, NULL, NULL, YES);
    });
}
+ (void)setListenerOnVerboseLoggingChanged:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_VERBOSE_LOGGING
                               block:block];
}

+ (void)notifyReport {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_REPORT, NULL, NULL, YES);
    });
}
+ (void)setListenerOnReport:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_REPORT
                               block:block];
}

+ (void)notifyAdvancedBlockingExtension {
    dispatch_async(dispatch_get_main_queue(), ^{
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), (CFStringRef)NOTIFICATION_ADVANCED_BLOCKING, NULL, NULL, YES);
    });
}

+ (void)setListenerOnAdvancedBlocking:(AESListenerBlock)block {
    [self setListenerForNotification:NOTIFICATION_ADVANCED_BLOCKING
                               block:block];
}

/////////////////////////////////////////////////////////////////////
#pragma mark Access to shared resources (public methods)

+ (void)setBlockingContentRulesJson:(NSData *)jsonData bundleId:(NSString *)bundleId completion:(void (^)(void))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            DDLogInfo(@"AG: setBlockingContentRulesJson");

            NSData *data = jsonData ?: [NSData data];

            NSDictionary *d = @{
                                AG_BLOCKER_BUNDLEID: AES_BLOCKING_CONTENT_RULES_RESOURCE,
                                AG_BLOCKER_PRIVACY_BUNDLEID: AES_BLOCKING_CONTENT_RULES_PRIVACY_RESOURCE,
                                AG_BLOCKER_SECURITY_BUNDLEID: AES_BLOCKING_CONTENT_RULES_SECURITY_RESOURCE,
                                AG_BLOCKER_SOCIAL_BUNDLEID: AES_BLOCKING_CONTENT_RULES_SOCIAL_RESOURCE,
                                AG_BLOCKER_OTHER_BUNDLEID: AES_BLOCKING_CONTENT_RULES_OTHER_RESOURCE,
                                AG_BLOCKER_CUSTOM_BUNDLEID: AES_BLOCKING_CONTENT_RULES_CUSTOM_RESOURCE
                                };

            NSString *path = d[bundleId];
            [self saveData:data toFileRelativePath:path];

            DDLogInfo(@"AG: setBlockingContentRulesJson - ok");

            if (completion) {
                completion();
            }
        }
    });
}

+ (void)setAdvancedBlockingContentRulesJson:(NSData *)jsonData completion:(void (^)(void))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            DDLogInfo(@"AG: setAdvancedBlockingContentRulesJson");

            NSData *data = jsonData ?: [NSData data];
            [self saveData:data toFileRelativePath:AES_ADV_BLOCKING_CONTENT_RULES_RESOURCE];

            DDLogInfo(@"AG: setAdvancedBlockingContentRulesJson - ok");
            if (completion) {
                completion();
            }
        }
    });
}

+ (NSURL *)blockingContentRulesEmptyUrl {
    NSURL *resourceUrl = [[NSBundle mainBundle] resourceURL];
    return [resourceUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_EMPTY_RESOURCE];
}

+ (NSURL *)blockingContentRulesUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_RESOURCE];
}

+ (NSURL *)blockingContentPrivacyUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_PRIVACY_RESOURCE];
}

+ (NSURL *)blockingContentSecurityUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_SECURITY_RESOURCE];
}


+ (NSURL *)blockingContentSocialUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_SOCIAL_RESOURCE];
}

+ (NSURL *)blockingContentOtherUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_OTHER_RESOURCE];
}

+ (NSURL *)blockingContentCustomUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_BLOCKING_CONTENT_RULES_CUSTOM_RESOURCE];
}

+ (NSURL *)advancedBlockingContentRulesUrl {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_ADV_BLOCKING_CONTENT_RULES_RESOURCE];
}

+ (NSString *)advancedBlockingContentRulesUrlString {
    return  [_containerFolderUrl URLByAppendingPathComponent:AES_ADV_BLOCKING_CONTENT_RULES_RESOURCE].path;
}

+ (void)setAllowlistDomains:(NSArray <NSString *> *)domains completion:(void (^)(void))completion {
    [self saveObject:domains key:AES_ALLOWLIST_DOMAINS completion:completion];
}

+ (void)allowlistDomainsWithCompletion:(void (^)(NSArray <NSString *> *domains))completion {

    [self loadObjectWithKey:AES_ALLOWLIST_DOMAINS class:[NSArray class] completion:completion];
}

+ (void)setUserFilterRules:(NSArray <NSString *> *)rules completion:(void (^)(void))completion {

    [self saveObject:rules key:AES_USERFILTER_RULES completion:completion];
}

+ (void)userFilterRulesWithCompletion:(void (^)(NSArray <NSString *> *rules))completion {

    [self loadObjectWithKey:AES_USERFILTER_RULES class:[NSArray class] completion:completion];
}

+ (void)setCustomFilterInfo:(NSDictionary *)customFilterInfo completion:(void (^)(void))completion {

    [self saveObject:customFilterInfo key:AES_CUSTOM_FILTER_INFO completion:completion];
}

+ (void)customFilterInfoWithCompletion:(void (^)(NSDictionary *customFilterInfo))completion {

    [self loadObjectWithKey:AES_CUSTOM_FILTER_INFO class:[NSDictionary class] completion:completion];
}

+ (void)DDLogInfo:(NSString *)message {
    DDLogInfo(@"AG: %@", message);
}

+ (void)DDLogError:(NSString *)message {
    DDLogInfo(@"AG: %@", message);
}


/////////////////////////////////////////////////////////////////////
#pragma mark Helper methods (private)

+ (void)setListenerForNotification:(NSString *)notificationName
                             block:(AESListenerBlock)block {

    AESListenerBlock prevBlock = ListenerHolder[notificationName];
    if (prevBlock) {
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
    ListenerHolder[notificationName] = block;
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
                DDLogInfo(@"AG: loadDataFromFileRelativePath: %@", relativePath);

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
                NSData *data;
                if (@available(macOS 10.13, *)) {
                    NSError *err;
                    data  = [NSKeyedArchiver archivedDataWithRootObject:obj requiringSecureCoding:YES error:&err];
                    if (err) {
                        DDLogError(@"Converting error %@ to archive: %@", obj, err);
                    }
                } else {
                    data  = [NSKeyedArchiver archivedDataWithRootObject:obj];
                }
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

+ (void)loadObjectWithKey:(NSString *)key class:(Class)aClass completion:(void (^)(id obj))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            NSData *data = [self loadDataFromFileRelativePath:key];
            id result = nil;
            if (data.length) {
                if (@available(macOS 10.13, *)) {
                    NSError *err;
                    result = [NSKeyedUnarchiver unarchivedObjectOfClass:aClass fromData:data error:&err];
                    if (err) {
                        DDLogError(@"Converting error object from archive: %@", err);
                    }
                }
                else {
                    result = [NSKeyedUnarchiver unarchiveObjectWithData:data];
                }
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
#pragma mark Darwin notification callbacks (private)

static void onChangedNotify(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo) {
    NSString *nName = (__bridge NSString *)name;
    AESListenerBlock block = ListenerHolder[nName];
    if (block) {
        block();
    }
}

@end

