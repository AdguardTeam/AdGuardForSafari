//
//  FlatButton.swift
//  Disk Sensei
//
//  Created by Oskar Groth on 02/08/16.
//  Copyright © 2016 Cindori. All rights reserved.
//

import Cocoa
import QuartzCore

internal extension CALayer {
    internal func animate(color: CGColor, keyPath: String, duration: Double) {
        if value(forKey: keyPath) as! CGColor? != color {
            let animation = CABasicAnimation(keyPath: keyPath)
            animation.toValue = color
            animation.fromValue = value(forKey: keyPath)
            animation.duration = duration
            animation.isRemovedOnCompletion = false
            animation.fillMode = kCAFillModeForwards
            add(animation, forKey: keyPath)
            setValue(color, forKey: keyPath)
        }
    }
}

//unused for now
internal extension NSColor {
    internal func tintedColor() -> NSColor {
        var h = CGFloat(), s = CGFloat(), b = CGFloat(), a = CGFloat()
        let rgbColor = usingColorSpaceName(NSColorSpaceName.calibratedRGB)
        rgbColor?.getHue(&h, saturation: &s, brightness: &b, alpha: &a)
        return NSColor(hue: h, saturation: s, brightness: b == 0 ? 0.2 : b * 0.8, alpha: a)
    }
}

@objc open class FlatButton: NSButton, CALayerDelegate {
    
    internal var containerLayer = CALayer()
    internal var iconLayer = CAShapeLayer()
    internal var alternateIconLayer = CAShapeLayer()
    internal var titleLayer = CATextLayer()
    internal var mouseDown = Bool()
    @IBInspectable public var momentary: Bool = true {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var onAnimationDuration: Double = 0
    @IBInspectable public var offAnimationDuration: Double = 0.1
    @IBInspectable public var glowRadius: CGFloat = 0 {
        didSet {
            containerLayer.shadowRadius = glowRadius
            animateColor(state == .on)
        }
    }
    @IBInspectable public var glowOpacity: Float = 0 {
        didSet {
            containerLayer.shadowOpacity = glowOpacity
            animateColor(state == .on)
        }
    }
    @IBInspectable public var cornerRadius: CGFloat = 4 {
        didSet {
            layer?.cornerRadius = cornerRadius
        }
    }
    @IBInspectable public var borderWidth: CGFloat = 1 {
        didSet {
            layer?.borderWidth = borderWidth
        }
    }
    @IBInspectable public var borderColor: NSColor = NSColor.darkGray {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var activeBorderColor: NSColor = NSColor.white {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var buttonColor: NSColor = NSColor.white {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var activeButtonColor: NSColor = NSColor.white {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var iconColor: NSColor = NSColor.gray {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var activeIconColor: NSColor = NSColor.black {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var textColor: NSColor = NSColor.gray {
        didSet {
            animateColor(state == .on)
        }
    }
    @IBInspectable public var activeTextColor: NSColor = NSColor.gray {
        didSet {
            animateColor(state == .on)
        }
    }
    
    override open var title: String {
        didSet {
            setupTitle()
        }
    }
    override open var font: NSFont? {
        didSet {
            setupTitle()
        }
    }
    override open var frame: NSRect {
        didSet {
            positionTitleAndImage()
        }
    }
    override open var image: NSImage? {
        didSet {
            setupImage()
        }
    }
    override open var alternateImage: NSImage? {
        didSet {
            setupImage()
        }
    }
    override open var isEnabled: Bool {
        didSet {
            alphaValue = isEnabled ? 1 : 0.5
        }
    }
    
    
    // MARK: Setup & Initialization
    
    required public init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }
    
    override init(frame: NSRect) {
        super.init(frame: frame)
        setup()
    }
    
    internal func setup() {
        wantsLayer = true
        layer?.masksToBounds = false
        containerLayer.masksToBounds = false
        layer?.cornerRadius = 4
        layer?.borderWidth = 1
        layer?.delegate = self
        //containerLayer.backgroundColor = NSColor.blue.withAlphaComponent(0.1).cgColor
        //titleLayer.backgroundColor = NSColor.red.withAlphaComponent(0.2).cgColor
        titleLayer.delegate = self
        if let scale = window?.backingScaleFactor {
            titleLayer.contentsScale = scale
        }
        iconLayer.delegate = self
        alternateIconLayer.delegate = self
        iconLayer.masksToBounds = true
        alternateIconLayer.masksToBounds = true
        containerLayer.shadowOffset = NSSize.zero
        containerLayer.shadowColor = NSColor.clear.cgColor
        containerLayer.frame = NSMakeRect(0, 0, bounds.width, bounds.height)
        containerLayer.addSublayer(iconLayer)
        containerLayer.addSublayer(alternateIconLayer)
        containerLayer.addSublayer(titleLayer)
        layer?.addSublayer(containerLayer)
        setupTitle()
        setupImage()
    }
    
    internal func setupTitle() {
        guard let font = font else {
            return
        }
        titleLayer.string = title
        titleLayer.font = font
        titleLayer.fontSize = font.pointSize
        positionTitleAndImage()
    }
    
    func positionTitleAndImage() {
        let attributes = [NSAttributedStringKey.font: font as Any]
        let titleSize = title.size(withAttributes: attributes)
        var titleRect = NSMakeRect(0, 0, titleSize.width, titleSize.height)
        var imageRect = iconLayer.frame
        let hSpacing = round((bounds.width-(imageRect.width+titleSize.width))/3)
        let vSpacing = round((bounds.height-(imageRect.height+titleSize.height))/3)
        
        switch imagePosition {
        case .imageAbove:
            titleRect.origin.y = bounds.height-titleRect.height - 2
            titleRect.origin.x = round((bounds.width - titleSize.width)/2)
            imageRect.origin.y = vSpacing
            imageRect.origin.x = round((bounds.width - imageRect.width)/2)
            break
        case .imageBelow:
            titleRect.origin.y = 2
            titleRect.origin.x = round((bounds.width - titleSize.width)/2)
            imageRect.origin.y = bounds.height-vSpacing-imageRect.height
            imageRect.origin.x = round((bounds.width - imageRect.width)/2)
            break
        case .imageLeft:
            titleRect.origin.y = round((bounds.height - titleSize.height)/2)
            titleRect.origin.x = bounds.width - titleSize.width - 6
            imageRect.origin.y = round((bounds.height - imageRect.height)/2)
            imageRect.origin.x = hSpacing
            break
        case .imageRight:
            titleRect.origin.y = round((bounds.height - titleSize.height)/2)
            titleRect.origin.x = 2
            imageRect.origin.y = round((bounds.height - imageRect.height)/2)
            imageRect.origin.x = bounds.width - imageRect.width - hSpacing
            break
        default:
            titleRect.origin.y = round((bounds.height - titleSize.height)/2)
            titleRect.origin.x = round((bounds.width - titleSize.width)/2)
        }
        iconLayer.frame = imageRect
        alternateIconLayer.frame = imageRect
        titleLayer.frame = titleRect
    }
    
    internal func setupImage() {
        guard let image = image else {
            return
        }
        let maskLayer = CALayer()
        let imageSize = image.size
        var imageRect:CGRect = NSMakeRect(0, 0, imageSize.width, imageSize.height)
        let imageRef = image.cgImage(forProposedRect: &imageRect, context: nil, hints: nil)
        maskLayer.contents = imageRef
        iconLayer.frame = imageRect
        maskLayer.frame = imageRect
        iconLayer.mask = maskLayer
        //maskLayer.backgroundColor = NSColor.green.withAlphaComponent(0.5).cgColor
        
        if let alternateImage = alternateImage {
            let altMaskLayer = CALayer()
            //altMaskLayer.backgroundColor = NSColor.green.withAlphaComponent(0.5).cgColor
            let altImageSize = alternateImage.size
            var altImageRect:CGRect = NSMakeRect(0, 0, altImageSize.width, altImageSize.height)
            let altImageRef = alternateImage.cgImage(forProposedRect: &altImageRect, context: nil, hints: nil)
            altMaskLayer.contents = altImageRef
            alternateIconLayer.frame = altImageRect
            altMaskLayer.frame = altImageRect
            alternateIconLayer.mask = altMaskLayer
            alternateIconLayer.frame = altImageRect
        }
        positionTitleAndImage()
    }
    
    override open func awakeFromNib() {
        super.awakeFromNib()
        let trackingArea = NSTrackingArea(rect: bounds, options: [.activeAlways, .inVisibleRect, .mouseEnteredAndExited], owner: self, userInfo: nil)
        addTrackingArea(trackingArea)
    }
    
    // MARK: Animations
    
    internal func removeAnimations() {
        layer?.removeAllAnimations()
        if layer?.sublayers != nil {
            for subLayer in (layer?.sublayers)! {
                subLayer.removeAllAnimations()
            }
        }
    }
    
    public func animateColor(_ isOn: Bool) {
        removeAnimations()
        let duration = isOn ? onAnimationDuration : offAnimationDuration
        let bgColor = isOn ? activeButtonColor : buttonColor
        let titleColor = isOn ? activeTextColor : textColor
        let imageColor = isOn ? activeIconColor : iconColor
        let borderColor = isOn ? activeBorderColor : self.borderColor
        layer?.animate(color: bgColor.cgColor, keyPath: "backgroundColor", duration: duration)
        layer?.animate(color: borderColor.cgColor, keyPath: "borderColor", duration: duration)
        
        /*  I started seeing high (~5%) background CPU usage in apps using
         FlatButton, and was able to track it down to background CATextLayer animation calls
         happening constantly, originating from the call below. It could be a CATextLayer bug.
         For now I'm going with setting the color instantly as it fixes this issue. */
        //titleLayer.animate(color: titleColor.cgColor, keyPath: "foregroundColor", duration: duration)
        titleLayer.foregroundColor = titleColor.cgColor
        
        if alternateImage == nil {
            iconLayer.animate(color: imageColor.cgColor, keyPath: "backgroundColor", duration: duration)
        } else {
            iconLayer.animate(color: isOn ? NSColor.clear.cgColor : iconColor.cgColor, keyPath: "backgroundColor", duration: duration)
            alternateIconLayer.animate(color: isOn ? activeIconColor.cgColor : NSColor.clear.cgColor, keyPath: "backgroundColor", duration: duration)
        }
        
        // Shadows
        
        if glowRadius > 0, glowOpacity > 0 {
            containerLayer.animate(color: isOn ? activeIconColor.cgColor : NSColor.clear.cgColor, keyPath: "shadowColor", duration: duration)
        }
    }
    
    // MARK: Interaction
    
    public func setOn(_ isOn: Bool) {
//        let nextState = isOn ? .on : .off
        let nextState = isOn ? NSControl.StateValue.on : NSControl.StateValue.off
        if nextState != state {
            state = nextState
            animateColor(state == .on)
        }
    }
    
    override open func hitTest(_ point: NSPoint) -> NSView? {
        return isEnabled ? super.hitTest(point) : nil
    }
    
    override open func mouseDown(with event: NSEvent) {
        if isEnabled {
            mouseDown = true
            setOn(state == .on ? false : true)
        }
    }
    
    override open func mouseEntered(with event: NSEvent) {
        if mouseDown {
            setOn(state == .on ? false : true)
        }
    }
    
    override open func mouseExited(with event: NSEvent) {
        if mouseDown {
            setOn(state == .on ? false : true)
            mouseDown = false
        }
    }
    
    override open func mouseUp(with event: NSEvent) {
        if mouseDown {
            mouseDown = false
            if momentary {
                setOn(state == .on ? false : true)
            }
            _ = target?.perform(action, with: self)
        }
    }
    
    // MARK: Drawing
    
    override open func viewDidChangeBackingProperties() {
        super.viewDidChangeBackingProperties()
        if let scale = window?.backingScaleFactor {
            titleLayer.contentsScale = scale
            layer?.contentsScale = scale
            iconLayer.contentsScale = scale
        }
    }
    
    override open func layer(_ layer: CALayer, shouldInheritContentsScale newScale: CGFloat, from window: NSWindow) -> Bool {
        return true
    }
    
    override open func draw(_ dirtyRect: NSRect) {
        
    }
    
    override open func layout() {
        super.layout()
        positionTitleAndImage()
    }
    
    override open func updateLayer() {
        super.updateLayer()
    }
    
    
}

