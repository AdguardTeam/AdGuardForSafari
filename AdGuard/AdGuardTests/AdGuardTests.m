//
//  AdGuardTests.m
//  AdGuardTests
//
//  Created by Roman Sokolov on 17.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <SafariServices/SafariServices.h>

@interface AdGuardTests : XCTestCase

@end

@implementation AdGuardTests

- (void)setUp {
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testSendMessage {

    [SFSafariApplication dispatchMessageWithName:@"test"
                       toExtensionWithIdentifier:@"com.adguard.safari.AdGuard.Extension"
                                        userInfo:@{@"params": @"{\"prm1\":1}"}
                               completionHandler:^(NSError * _Nullable error) {

                                   NSLog(@"Error object: %@", error);
                               }];
}

- (void)testCode {

    NSString *string = @"test string";

    void *ptr = CFBridgingRetain(string);

    string = nil;

    NSString *newstring = CFBridgingRelease(ptr);

    ptr = NULL;

    NSLog(@"New string: %@", newstring);

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        NSString *test = [[NSString alloc]
                          initWithData:[NSData data]
                          encoding:NSUTF8StringEncoding];
    });

    [SFContentBlockerManager reloadContentBlockerWithIdentifier:@"" completionHandler:^(NSError * _Nullable error) {

    }];
}
/*
- (void)testPerformanceExample {
    // This is an example of a performance test case.
    [self measureBlock:^{
        // Put the code you want to measure the time of here.
    }];
}
*/
@end
