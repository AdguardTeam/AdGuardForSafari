//
//  PopupView.m
//  AdGuardSafariExtension
//
//  Created by Roman Sokolov on 29.08.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "PopupView.h"

#define GRADIENT_SIZE            15

@implementation PopupView

- (void)drawRect:(NSRect)dirtyRect {

    [super drawRect:dirtyRect];

//    [NSColor.whiteColor set];
//    NSRectFill(dirtyRect);
//
//    NSRect grRect = NSMakeRect(0, self.bounds.size.height - GRADIENT_SIZE, self.bounds.size.width, GRADIENT_SIZE);
//
//    NSGradient *gradient = [[NSGradient alloc] initWithStartingColor:NSColor.controlBackgroundColor
//                                                         endingColor:NSColor.whiteColor];
//    if (CGRectIntersectsRect(dirtyRect, grRect)) {
//        [gradient drawInRect:grRect angle:90.0f];
//    }

}

@end
