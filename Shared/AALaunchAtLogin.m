//
//  AALaunchAtLogin.m
//  Adguard
//
//  Created by Roman Sokolov on 11.03.15.
//  Copyright (c) 2015 Performix. All rights reserved.
//

#import "AALaunchAtLogin.h"
#import <ServiceManagement/ServiceManagement.h>
#import "CommonLib/ACLang.h"

/////////////////////////////////////////////////////////////////////
#pragma mark - AALaunchAtLogin
/////////////////////////////////////////////////////////////////////

@implementation AALaunchAtLogin {
    BOOL _enabled;
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods

-(id)initWithIdentifier:(NSString*)identifier {
    self = [self init];
    if(self) {
        _enabled = NO;
        self.identifier = identifier;
    }
    return self;
}

-(void)setIdentifier:(NSString *)identifier {
    _identifier = identifier;
    [self startAtLoginInternal];
    DDLogInfo(@"Launcher '%@' %@ configured to start at login",
          self.identifier, (_enabled ? @"is" : @"is not"));
}

- (BOOL)startAtLogin {
    return _enabled;
}

- (void)setStartAtLogin:(BOOL)flag {
    if (!_identifier)
        return;
    
    [self willChangeValueForKey:@"startAtLogin"];
    
    if (!SMLoginItemSetEnabled((__bridge CFStringRef)_identifier, (flag) ? true : false)) {
        DDLogError(@"SMLoginItemSetEnabled failed!");
        
    } else {
        [self willChangeValueForKey:@"enabled"];
        _enabled = flag;
        [self didChangeValueForKey:@"enabled"];
    }
    
    DDLogInfo(@"Launcher '%@' %@ configured to start at login",
              self.identifier, (_enabled ? @"is" : @"is not"));
    
    [self didChangeValueForKey:@"startAtLogin"];
}


+ (BOOL)removeOldLoginItem {

    LSSharedFileListItemRef itemRef = nil;
    NSURL *itemUrl;
    CFURLRef itemURL = nil;
    BOOL result = NO;
    
    // Get the app's URL.
    NSURL *appUrl = [NSURL fileURLWithPath:[[NSBundle mainBundle] bundlePath]];
    DDLogInfo("AppUrl for checking old login item: %@", appUrl);
    
    // Get the LoginItems list.
    LSSharedFileListRef loginItemsRef = LSSharedFileListCreate(NULL, kLSSharedFileListSessionLoginItems, NULL);
    if (loginItemsRef == nil) return result;
    DDLogInfo("Сhecking old login item: loginItemsRef obtained");
    // Iterate over the LoginItems.
    NSArray *loginItems = (NSArray *)CFBridgingRelease(LSSharedFileListCopySnapshot(loginItemsRef, nil));
    
    for (int currentIndex = 0; currentIndex < [loginItems count]; currentIndex++) {
        // Get the current LoginItem and resolve its URL.
        LSSharedFileListItemRef currentItemRef = (__bridge LSSharedFileListItemRef)[loginItems objectAtIndex:currentIndex];
        itemURL = LSSharedFileListItemCopyResolvedURL(currentItemRef, 0, NULL);
        if (itemURL) {
            // Compare the URLs for the current LoginItem and the app.
            itemUrl = CFBridgingRelease(itemURL);
            DDLogInfo("Сhecking old login item: item url: %@", itemUrl);
            if ([itemUrl isEqual:appUrl]) {
                // Save the LoginItem reference.
                itemRef = currentItemRef;
                DDLogInfo("Сhecking old login item: item found");
            }
        }
        
        if (itemRef)
        break;
    }

    if (itemRef != nil) {
        OSStatus osResult = LSSharedFileListItemRemove(loginItemsRef,itemRef);
        DDLogInfo(@"Remove old login item result: %d", osResult);
        if (osResult == 0) {
            result = YES;
        }
        
    }
    CFRelease(loginItemsRef);
    
    return result;
}

- (void)startAtLoginInternal {
    if (!_identifier)
        return;
    
    BOOL isEnabled  = NO;
    
    // the easy and sane method (SMJobCopyDictionary) can pose problems when sandboxed. -_-
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    CFArrayRef  cfJobDicts = SMCopyAllJobDictionaries(kSMDomainUserLaunchd);
#pragma clang diagnostic pop
    NSArray* jobDicts = CFBridgingRelease(cfJobDicts);
    
    if (jobDicts && [jobDicts count] > 0) {
        for (NSDictionary* job in jobDicts) {
            if ([_identifier isEqualToString:[job objectForKey:@"Label"]]) {
                isEnabled = [[job objectForKey:@"OnDemand"] boolValue];
                break;
            }
        }
    }
    
    if (isEnabled != _enabled) {
        [self willChangeValueForKey:@"enabled"];
        _enabled = isEnabled;
        [self didChangeValueForKey:@"enabled"];
    }
}


@end
