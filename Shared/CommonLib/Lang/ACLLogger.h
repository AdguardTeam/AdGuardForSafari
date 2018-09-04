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
#import <Foundation/Foundation.h>
#import "Logger/Lumberjack/CocoaLumberjack.h"

//Max log file size
#define ACL_MAX_LOG_FILE_SIZE     512000

// Set this log level for application.
typedef NS_ENUM(NSUInteger, ACLLogLevelType) {
    
    ACLLDefaultLevel = DDLogLevelInfo,
    ACLLDebugLevel = DDLogLevelDebug,
    ACLLVerboseLevel = DDLogLevelVerbose
    
};

// Redefine DDLog macros

#undef DDLogError
#undef DDLogWarn
#undef DDLogInfo
#undef DDLogDebug
#undef DDLogVerbose

#undef DDLogCError
#undef DDLogCWarn
#undef DDLogCInfo
#undef DDLogCDebug
#undef DDLogCVerbose

#define DDLogError(frmt, ...)   LOG_MAYBE(NO,                LOG_LEVEL_DEF, DDLogFlagError,   0, nil, __PRETTY_FUNCTION__, @"(%@[%p] %@) " frmt, THIS_FILE, self, THIS_METHOD, ##__VA_ARGS__)
#define DDLogWarn(frmt, ...)    LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagWarning, 0, nil, __PRETTY_FUNCTION__, @"(%@) " frmt, THIS_FILE, ##__VA_ARGS__)
#define DDLogInfo(frmt, ...)    LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagInfo,    0, nil, __PRETTY_FUNCTION__, @"(%@) " frmt, THIS_FILE, ##__VA_ARGS__)
#define DDLogDebug(frmt, ...)   LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagDebug,   0, nil, __PRETTY_FUNCTION__, @"(%@[%p] %@) " frmt, THIS_FILE, self, THIS_METHOD, ##__VA_ARGS__)
#define DDLogVerbose(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagVerbose, 0, nil, __PRETTY_FUNCTION__, @"(%@[%p] %@) " frmt, THIS_FILE, self, THIS_METHOD, ##__VA_ARGS__)

#define DDLogCError(frmt, ...)   LOG_MAYBE(NO,                LOG_LEVEL_DEF, DDLogFlagError,   0, nil, __PRETTY_FUNCTION__, @"(%@ %s) " frmt, THIS_FILE, __FUNCTION__, ##__VA_ARGS__)
#define DDLogCWarn(frmt, ...)    LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagWarning, 0, nil, __PRETTY_FUNCTION__, @"(%@) " frmt, THIS_FILE, ##__VA_ARGS__)
#define DDLogCInfo(frmt, ...)    LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagInfo,    0, nil, __PRETTY_FUNCTION__, @"(%@) " frmt, THIS_FILE, ##__VA_ARGS__)
#define DDLogCDebug(frmt, ...)   LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagDebug,   0, nil, __PRETTY_FUNCTION__, @"(%@ %s) " frmt, THIS_FILE, __FUNCTION__, ##__VA_ARGS__)
#define DDLogCVerbose(frmt, ...) LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagVerbose, 0, nil, __PRETTY_FUNCTION__, @"(%@ %s) " frmt, THIS_FILE, __FUNCTION__, ##__VA_ARGS__)

// Our macros
#define DDLogTrace() LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagVerbose, 0, nil, __PRETTY_FUNCTION__, @"Trace - %@[%p]: %@", THIS_FILE, self, THIS_METHOD)
#define DDLogVerboseTrace() DDLogTrace()
#define DDLogDebugTrace() LOG_MAYBE(LOG_ASYNC_ENABLED, LOG_LEVEL_DEF, DDLogFlagDebug,   0, nil, __PRETTY_FUNCTION__,  @"Debug trace - %@[%p]: %@", THIS_FILE, self, THIS_METHOD)
#define DDLogErrorTrace() LOG_MAYBE(NO,                LOG_LEVEL_DEF, DDLogFlagError,   0, nil, __PRETTY_FUNCTION__, @"Error trace - %@[%p]: %@", THIS_FILE, self, THIS_METHOD)


extern DDLogLevel ddLogLevel;

@class ACLFileLogger;

/**
    Global logger class, which have one singleton object.
 */
@interface ACLLogger : NSObject

+ (ACLLogger *)singleton;

/**
 Initializing of logger.
 This method must be called before writing to log file.

 @param folderURL URL of the directory where logger will be write logs.
 If nil then will be used default value, that is name of process.
 */
- (void)initLogger:(NSURL *)folderURL;

/// Access to file logger. It need for extracting info from log files.
@property (readonly) ACLFileLogger *fileLogger;

/// Log level of the application.
@property ACLLogLevelType logLevel;

/// Flush all logs.
- (void)flush;

@end
