/// This code was generated automatically by proto-parser tool version 1

import Foundation
import SciterSwift

// MARK: Protocol definition

/// Service that handles client-platform communication
/// YOU MUST IMPLEMENT THIS PROTOCOL USING CLASS WITH TYPE `OnboardingService.ServiceType` IN SEPARATE SOURCE FILE
public protocol OnboardingServiceProtocol
{
	/// Notifies that onboarding did complete.
	func onboardingDidComplete (
						_ message: EmptyValue,
						_ promise: @escaping (EmptyValue) -> Void) -> Void
	/// Get effective theme
	func getEffectiveTheme (
						_ message: EmptyValue,
						_ promise: @escaping (EffectiveThemeValue) -> Void) -> Void
}

// MARK: Protobuf Bridge definition
// It is base class for custom service class with type `OnboardingService.ServiceType`

/// Service that handles client-platform communication
open class OnboardingService: SciterBridge
{
	public override var serviceName: String { "OnboardingService" }
    public typealias ServiceType = OnboardingService & Service & OnboardingServiceProtocol

	/// Wrapper for `OnboardingDidComplete`
	@objc func OnboardingDidComplete(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: EmptyValue.self,
			method: cast.onboardingDidComplete(_:_:),
			message,
			promise
		)
	}

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