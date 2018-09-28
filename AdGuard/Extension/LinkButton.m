//
//  LinkButton.m
//  AdGuardSafariExtension
//
//  Created by Roman Sokolov on 28.09.2018.
//  Copyright © 2018 Roman Sokolov. All rights reserved.
//

#import "LinkButton.h"

@implementation LinkButton  {

    NSTrackingArea *_trackArea;
    BOOL _mouseEntered;
}


- (id)initWithCoder:(NSCoder *)aDecoder{

    self = [super initWithCoder:aDecoder];
    if (self) {

        _mouseEntered = NO;
    }

    return self;
}

- (id)initWithFrame:(NSRect)frameRect{

    self = [super initWithFrame:frameRect];
    if (self) {

        _mouseEntered = NO;
    }

    return self;
}

- (id)init{

    self = [super init];
    if (self) {

        _mouseEntered = NO;
    }

    return self;
}

- (void)updateTrackingAreas{

    [super updateTrackingAreas];

    if (_trackArea) {

        [self removeTrackingArea:_trackArea];
        _trackArea = nil;
    }

    NSTrackingAreaOptions opt = NSTrackingInVisibleRect | NSTrackingMouseEnteredAndExited | NSTrackingActiveInKeyWindow;

    _trackArea = [[NSTrackingArea alloc] initWithRect:NSZeroRect options:opt owner:self userInfo:nil];

    [self addTrackingArea:_trackArea];
}

- (void)mouseEntered:(NSEvent *)theEvent{

    _mouseEntered = YES;
    [self setNeedsDisplay:YES];
}

- (void)mouseExited:(NSEvent *)theEvent{

    _mouseEntered = NO;
    [self setNeedsDisplay:YES];
}

- (void)drawRect:(NSRect)dirtyRect {

    NSMutableAttributedString *theTitle = [self.attributedTitle mutableCopy];
    [theTitle addAttribute:NSForegroundColorAttributeName
                     value:NSColor.disabledControlTextColor
                     range:NSMakeRange(0, theTitle.length)];
    if (_mouseEntered && self.enabled) {
        [theTitle addAttribute:NSUnderlineStyleAttributeName
                         value:@(NSUnderlinePatternSolid | NSUnderlineStyleSingle)
                         range:NSMakeRange(0, theTitle.length)];
    }
    [theTitle drawInRect:dirtyRect];
}

- (void)resetCursorRects {
    if (self.enabled) {
        [self addCursorRect:[self bounds] cursor: [NSCursor pointingHandCursor]];
    }
    else {
        [self addCursorRect:[self bounds] cursor: [NSCursor arrowCursor]];
    }
}

- (void)setEnabled:(BOOL)enabled {
    [super setEnabled:enabled];
    [self.window invalidateCursorRectsForView:self];
}
@end
