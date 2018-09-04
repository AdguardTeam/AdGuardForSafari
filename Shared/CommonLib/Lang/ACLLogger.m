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
#import "ACLLogger.h"
#import "ACLFileLogger.h"

DDLogLevel ddLogLevel = DDLogLevelVerbose;

@implementation ACLLogger

static ACLLogger *singletonLogger;

- (id)init{
    
    if (self != singletonLogger)
        return nil;
        
    self = [super init];
    if (self)
    {
        ddLogLevel = ACLLDefaultLevel;
    }
    
    return self;

}


+ (ACLLogger *)singleton{
    
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        
        singletonLogger = [ACLLogger alloc];
        singletonLogger = [singletonLogger init];
    });
    
    return singletonLogger;
    
}

- (void)initLogger:(NSURL *)folderURL{

    __weak __typeof__(self) wself = self;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        __typeof__(self) sself = wself;
        DDLogFileManagerDefault *defaultLogFileManager = [[DDLogFileManagerDefault alloc] initWithLogsDirectory:[folderURL path]];

        sself->_fileLogger = [[ACLFileLogger alloc] initWithLogFileManager:defaultLogFileManager];
        sself->_fileLogger.rollingFrequency = 60 * 60 * 24; // 24 hour rolling
        sself->_fileLogger.logFileManager.maximumNumberOfLogFiles = 7;
        sself->_fileLogger.maximumFileSize = ACL_MAX_LOG_FILE_SIZE;

        [DDLog addLogger:sself->_fileLogger];
        [DDLog addLogger:[DDOSLogger sharedInstance]];
#ifdef DEBUG
        [DDLog addLogger:[DDTTYLogger sharedInstance]];
#endif

    });
}

/////////////////////////////////////////////////////////////////////
#pragma mark Properties and public methods
/////////////////////////////////////////////////////////////////////

- (void)setLogLevel:(ACLLogLevelType)logLevel{
    
    [self willChangeValueForKey:@"logLevel"];
    [self.fileLogger rollLogFileWithCompletionBlock:^{
        ddLogLevel = logLevel;
        [self didChangeValueForKey:@"logLevel"];
    }];
}

- (ACLLogLevelType)logLevel{
    
    switch (ddLogLevel) {
        case ACLLDefaultLevel:
            return ACLLDefaultLevel;
            break;
            
        case ACLLDebugLevel:
            return ACLLDebugLevel;
            break;
            
        default:
            return ACLLDefaultLevel;
            break;
    }
}

- (void)flush{
    
    [DDLog flushLog];
}

@end
