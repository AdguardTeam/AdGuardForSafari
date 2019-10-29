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
    NSURL    *_url;
    BOOL _enabled;
}

+ (BOOL)automaticallyNotifiesObserversForKey:(NSString *)theKey {
    BOOL automatic = NO;
    
    if ([theKey isEqualToString:@"startAtLogin"]) {
        automatic = NO;
    } else if ([theKey isEqualToString:@"enabled"]) {
        automatic = NO;
    } else {
        automatic=[super automaticallyNotifiesObserversForKey:theKey];
    }
    
    return automatic;
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods

-(id)initWithIdentifier:(NSString*)identifier {
    self = [self init];
    if(self) {
        self.identifier = identifier;
    }
    return self;
}

-(void)setIdentifier:(NSString *)identifier {
    _identifier = identifier;
    [self startAtLogin];
    DDLogInfo(@"Launcher '%@' %@ configured to start at login",
          self.identifier, (_enabled ? @"is" : @"is not"));
    // try to remove old approuch
    if (_enabled == NO) {
        [self removeOldLoginItem];
    }

}

- (BOOL)startAtLogin {
    if (!_identifier)
        return NO;
    
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
    
    return isEnabled;
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


- (void)removeOldLoginItem {
    /*
    LSSharedFileListItemRef itemRef = nil;
    NSURL *itemUrl;
    CFURLRef itemURL = nil;
    
    // Get the app's URL.
    NSURL *appUrl = [NSURL fileURLWithPath:[[NSBundle mainBundle] bundlePath]];
    // Get the LoginItems list.
    LSSharedFileListRef loginItemsRef = LSSharedFileListCreate(NULL, kLSSharedFileListSessionLoginItems, NULL);
    if (loginItemsRef == nil) return;
    // Iterate over the LoginItems.
    NSArray *loginItems = (NSArray *)CFBridgingRelease(LSSharedFileListCopySnapshot(loginItemsRef, nil));
    
    for (int currentIndex = 0; currentIndex < [loginItems count]; currentIndex++) {
        // Get the current LoginItem and resolve its URL.
        LSSharedFileListItemRef currentItemRef = (__bridge LSSharedFileListItemRef)[loginItems objectAtIndex:currentIndex];
        itemURL = LSSharedFileListItemCopyResolvedURL(currentItemRef, 0, NULL);
        if (itemURL) {
            // Compare the URLs for the current LoginItem and the app.
            itemUrl = CFBridgingRelease(itemURL);
            if ([itemUrl isEqual:appUrl]) {
                // Save the LoginItem reference.
                itemRef = currentItemRef;
            }
        }
        
        if (itemRef)
        break;
    }

    if (itemRef != nil) {
        LSSharedFileListItemRemove(loginItemsRef,itemRef);
    }
    CFRelease(loginItemsRef);
     */
}

@end
