//
//  GreenButtonCell.m
//  AdGuardSafariExtension
//
//  Created by Roman Sokolov on 11.09.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "GreenButtonCell.h"

#define CORNER_RADIUS       3.0
#define OFFSET_Y            -1.5
#define BEZEL_INSET         6.0
#define BASE_BUTTON_HEIGHT  20.0

@implementation GreenButtonCell

- (void)drawBezelWithFrame:(NSRect)frame
                    inView:(NSView *)controlView {

    frame = NSInsetRect(frame, BEZEL_INSET, (frame.size.height - BASE_BUTTON_HEIGHT)/2);
    frame = NSOffsetRect(frame, 0, OFFSET_Y);


    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = CGSizeMake(0, -1);
    shadow.shadowBlurRadius = 1.5;
    shadow.shadowColor = [NSColor colorWithSRGBRed:0 green:0 blue:0 alpha:0.15];

    NSBezierPath *path = [NSBezierPath bezierPathWithRoundedRect:frame
                                                         xRadius:CORNER_RADIUS
                                                         yRadius:CORNER_RADIUS];

    if ((self.showsStateBy & NSChangeBackgroundCellMask) && (self.isHighlighted || self.state != NSOffState)) {
        [[self colorWithSketchRed:103 green:178 blue:121 alfa:100] setFill];
        [shadow set];
        [path fill];
    }
    else {
        [[NSColor whiteColor] setFill];
        [shadow set];
        [path fill];

        [[NSColor colorWithSRGBRed:0 green:0 blue:0 alpha:0.15] set];
        path = [NSBezierPath bezierPathWithRoundedRect:NSInsetRect(frame, 1, 1)
                                               xRadius:CORNER_RADIUS
                                               yRadius:CORNER_RADIUS];
        [path setLineWidth:1];
        [path stroke];
    }
}

- (void)setButtonType:(NSButtonType)type {
    [super setButtonType:type];
}

- (NSColor *)colorWithSketchRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alfa:(CGFloat)alfa {
    return [NSColor colorWithSRGBRed:red/255 green:green/255 blue:blue/255 alpha:alfa/100];
}

@end
