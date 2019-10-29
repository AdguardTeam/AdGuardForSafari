//
//  AALaunchAtLogin.h
//  Adguard
//
//  Created by Roman Sokolov on 11.03.15.
//  Copyright (c) 2015 Performix. All rights reserved.
//

#import <Foundation/Foundation.h>

/////////////////////////////////////////////////////////////////////
#pragma mark - AALaunchAtLogin

@interface AALaunchAtLogin : NSObject

@property (assign, nonatomic, readwrite)   BOOL startAtLogin;
@property (copy, nonatomic, readwrite)     NSString *identifier;

-(id)initWithIdentifier:(NSString*)identifier;

@end
