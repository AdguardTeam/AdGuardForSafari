/// This code was generated automatically by proto-parser tool version 1

import SciterSwift

// MARK: `toSciter` service implementation

/// Service handles settings lists
public class UserRulesCallbackService: SwiftBridge
{
	/// Fires when user rules were updated through assistant
	@discardableResult public func onUserFilterChange (_ message: UserRulesCallbackState) -> EmptyValue {
		return self.sciterCall(message, function: "UserRulesCallbackService.onUserFilterChange")
	}
}
