/// This code was generated automatically by proto-parser tool version 1

import SciterSwift

// MARK: `toSciter` service implementation

/// Service handles onboarding updates
public class OnboardingCallbackService: SwiftBridge
{
	/// Fires when effective theme changed
	@discardableResult public func onEffectiveThemeChanged (_ message: EffectiveThemeValue) -> EmptyValue {
		return self.sciterCall(message, function: "OnboardingCallbackService.OnEffectiveThemeChanged")
	}
}
