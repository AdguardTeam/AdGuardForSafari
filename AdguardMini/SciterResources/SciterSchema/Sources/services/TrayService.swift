/// This code was generated automatically by proto-parser tool version 1

import Foundation
import SciterSwift

// MARK: Protocol definition

/// Service that handles tray settings
/// YOU MUST IMPLEMENT THIS PROTOCOL USING CLASS WITH TYPE `TrayService.ServiceType` IN SEPARATE SOURCE FILE
public protocol TrayServiceProtocol
{
	/// Get effective theme
	func getEffectiveTheme (
						_ message: EmptyValue,
						_ promise: @escaping (EffectiveThemeValue) -> Void) -> Void
}

// MARK: Protobuf Bridge definition
// It is base class for custom service class with type `TrayService.ServiceType`

/// Service that handles tray settings
open class TrayService: SciterBridge
{
	public override var serviceName: String { "TrayService" }
    public typealias ServiceType = TrayService & Service & TrayServiceProtocol

	/// Wrapper for `GetEffectiveTheme`
	@objc func GetEffectiveTheme(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: EffectiveThemeValue.self,
			method: cast.getEffectiveTheme(_:_:),
			message,
			promise
		)
	}

	private var cast : ServiceType
	{
		if let service = self as? ServiceType {
			return service
		}

		fatalError()
	}
}