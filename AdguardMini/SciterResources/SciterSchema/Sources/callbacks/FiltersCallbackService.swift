/// This code was generated automatically by proto-parser tool version 1

import SciterSwift

// MARK: `toSciter` service implementation

/// Service handles filters lists
public class FiltersCallbackService: SwiftBridge
{
	/// Fires when filters list updated
	@discardableResult public func onFiltersUpdate (_ message: EmptyValue) -> EmptyValue {
		return self.sciterCall(message, function: "FiltersCallbackService.OnFiltersUpdate")
	}
	/// Fires when filters index updated
	@discardableResult public func onFiltersIndexUpdate (_ message: FiltersIndex) -> EmptyValue {
		return self.sciterCall(message, function: "FiltersCallbackService.OnFiltersIndexUpdate")
	}
	/// Fires when user asked to subscribe on custom filter
	@discardableResult public func onCustomFiltersSubscribe (_ message: StringValue) -> EmptyValue {
		return self.sciterCall(message, function: "FiltersCallbackService.OnCustomFiltersSubscribe")
	}
}
