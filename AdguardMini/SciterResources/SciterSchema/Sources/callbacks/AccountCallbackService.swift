/// This code was generated automatically by proto-parser tool version 1

import SciterSwift

// MARK: `toSciter` service implementation

/// Service handles account updates
public class AccountCallbackService: SwiftBridge
{
	/// Fires when license state updated
	@discardableResult public func onLicenseUpdate (_ message: LicenseOrError) -> EmptyValue {
		return self.sciterCall(message, function: "AccountCallbackService.OnLicenseUpdate")
	}
}
