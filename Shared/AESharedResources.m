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

#define AES_BLOCKING_CONTENT_RULES_RESOURCE     @"blocking-content-rules.json"
#define AES_WHITELIST_DOMAINS                   @"whitelist-domains.txt"
#define AES_USERFILTER_RULES                    @"userfilter-rules.txt"


/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources

@implementation AESharedResources

static void onDefaultsChanged(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo);
static void onWhitelistChanged(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo);
static void onUserFilterChanged(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo);

/////////////////////////////////////////////////////////////////////
#pragma mark Initialize
/////////////////////////////////////////////////////////////////////

static NSURL *_containerFolderUrl;
static NSUserDefaults *_sharedUserDefaults;

+ (void)initialize{
    
    if (self == [AESharedResources class]) {
        
        _containerFolderUrl = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:AG_GROUP];
        _sharedUserDefaults = [[NSUserDefaults alloc] initWithSuiteName:AG_GROUP];
    }
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods
/////////////////////////////////////////////////////////////////////

+ (NSURL *)sharedResuorcesURL{
    
    return _containerFolderUrl;
}

+ (NSUserDefaults *)sharedDefaults{

    return _sharedUserDefaults;
}

+ (void)synchronizeSharedDefaults{

    [_sharedUserDefaults synchronize];
}

+ (void)notifyDefaultsChanged {

}
+ (void)listenDefaultsChanged:(void (^)(void))block {

}

+ (void)notifyWhitelistChanged {

}
+ (void)setListenerWhitelistChanged:(void (^)(void))block {

}

+ (void)notifyUserFilterChanged {

}
+ (void)listenUserFilterChanged:(void (^)(void))block {

}


+ (void)setBlockingContentRulesJson:(NSString *)jsonString completion:(void (^)(void))completion {

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        @autoreleasepool {
            NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding] ?: [NSData data];
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
#pragma mark Storage methods (private)
/////////////////////////////////////////////////////////////////////


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

@end

