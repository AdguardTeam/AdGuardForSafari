//
//  main.m
//  AdGuard Login Helper
//
//  Created by Roman Sokolov on 28/10/2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

#import <Cocoa/Cocoa.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // Check if main app is already running; if yes, do nothing and terminate helper app
        BOOL alreadyRunning = NO;
        NSArray *running = [[NSWorkspace sharedWorkspace] runningApplications];
        for (NSRunningApplication *app in running) {
            if ([[app bundleIdentifier] isEqualToString:AG_BUNDLEID]) {
                alreadyRunning = YES;
                break;
            }
        }
        
        if (!alreadyRunning) {
            NSString *appPath = [[[[[[NSBundle mainBundle] bundlePath] stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]  stringByDeletingLastPathComponent] stringByDeletingLastPathComponent];
            // get to the waaay top. Goes through LoginItems, Library, Contents, Applications
            NSURL *url = [NSURL fileURLWithPath:appPath];
            if (url == nil) {
                NSLog(@"AdGuard For Safari Login Helper: Can't obtain URL for Main App.");
            }
            else {
                NSURL *urlToOpen = [NSURL URLWithString:@"agsafari://launchInBackground"];
                
                NSError *error = nil;
                [NSWorkspace.sharedWorkspace openURLs:@[urlToOpen]
                                 withApplicationAtURL:url
                                              options:0
                                        configuration:@{}
                                                error:&error];
                
                if (error) {
                    NSLog(@"AdGuard For Safari Login Helper: An error occurred: %@", error.localizedDescription);
                } else {
                    NSLog(@"AdGuard For Safari Login Helper: URL successfully opened in safari extension");
                }
            }
        }
    }

    return 0;
}
