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

/////////////////////////////////////////////////////////////////////
#pragma mark - AESharedResources
/////////////////////////////////////////////////////////////////////

@implementation AESharedResources

/////////////////////////////////////////////////////////////////////
#pragma mark Initialize
/////////////////////////////////////////////////////////////////////

static NSURL *_containerFolderUrl;

+ (void)initialize{
    
    if (self == [AESharedResources class]) {
        
        _containerFolderUrl = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:AG_GROUP];
    }
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods
/////////////////////////////////////////////////////////////////////

+ (NSURL *)sharedResuorcesURL{
    
    return _containerFolderUrl;
}


+ (NSData *)blockingContentRules{
    
    return [self loadDataFromFileRelativePath:AES_BLOCKING_CONTENT_RULES_RESOURCE];
}

+ (void)setBlockingContentRules:(NSData *)blockingContentRules{

    [self saveData:blockingContentRules toFileRelativePath:AES_BLOCKING_CONTENT_RULES_RESOURCE];
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

- (NSString*) pathForRelativePath:(NSString*) relativePath {
    
    NSURL *dataUrl = [_containerFolderUrl URLByAppendingPathComponent:relativePath];
    
    return dataUrl.path;
}

@end

