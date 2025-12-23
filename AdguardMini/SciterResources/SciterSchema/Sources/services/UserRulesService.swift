/// This code was generated automatically by proto-parser tool version 1

import Foundation
import SciterSwift

// MARK: Protocol definition

/// Service that handles client-platform communication
/// YOU MUST IMPLEMENT THIS PROTOCOL USING CLASS WITH TYPE `UserRulesService.ServiceType` IN SEPARATE SOURCE FILE
public protocol UserRulesServiceProtocol
{
	/// Get UserRules settings
	func getUserRules (
						_ message: EmptyValue,
						_ promise: @escaping (UserRules) -> Void) -> Void
	/// Add UserRule
	func addUserRule (
						_ message: StringValue,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Update UserRules settings
	func updateUserRules (
						_ message: UserRules,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Export UserRules settings
	func exportUserRules (
						_ message: Path,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Import UserRules settings
	func importUserRules (
						_ message: Path,
						_ promise: @escaping (UserRules) -> Void) -> Void
	/// Reset UserRules to default settings
	func resetUserRules (
						_ message: EmptyValue,
						_ promise: @escaping (UserRules) -> Void) -> Void
}

// MARK: Protobuf Bridge definition
// It is base class for custom service class with type `UserRulesService.ServiceType`

/// Service that handles client-platform communication
open class UserRulesService: SciterBridge
{
	public override var serviceName: String { "UserRulesService" }
    public typealias ServiceType = UserRulesService & Service & UserRulesServiceProtocol

	/// Wrapper for `GetUserRules`
	@objc func GetUserRules(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: UserRules.self,
			method: cast.getUserRules(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `AddUserRule`
	@objc func AddUserRule(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: StringValue.self,
			outputType: OptionalError.self,
			method: cast.addUserRule(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `UpdateUserRules`
	@objc func UpdateUserRules(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: UserRules.self,
			outputType: OptionalError.self,
			method: cast.updateUserRules(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `ExportUserRules`
	@objc func ExportUserRules(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: Path.self,
			outputType: OptionalError.self,
			method: cast.exportUserRules(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `ImportUserRules`
	@objc func ImportUserRules(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: Path.self,
			outputType: UserRules.self,
			method: cast.importUserRules(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `ResetUserRules`
	@objc func ResetUserRules(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: UserRules.self,
			method: cast.resetUserRules(_:_:),
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