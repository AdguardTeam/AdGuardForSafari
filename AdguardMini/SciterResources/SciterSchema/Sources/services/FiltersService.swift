/// This code was generated automatically by proto-parser tool version 1

import Foundation
import SciterSwift

// MARK: Protocol definition

/// Service handles about app information
/// YOU MUST IMPLEMENT THIS PROTOCOL USING CLASS WITH TYPE `FiltersService.ServiceType` IN SEPARATE SOURCE FILE
public protocol FiltersServiceProtocol
{
	/// Get Filters app info
	func getFiltersMetadata (
						_ message: EmptyValue,
						_ promise: @escaping (Filters) -> Void) -> Void
	/// Get ids of enabled filters
	func getEnabledFiltersIds (
						_ message: EmptyValue,
						_ promise: @escaping (FiltersEnabledIds) -> Void) -> Void
	/// Check Custom Filter
	func checkCustomFilter (
						_ message: Path,
						_ promise: @escaping (FilterOrError) -> Void) -> Void
	/// Confirm add Custom filter
	func confirmAddCustomFilter (
						_ message: CustomFilterToAdd,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Delete custom filters
	func deleteCustomFilters (
						_ message: CustomFiltersToDelete,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Update filters settings
	func updateFilters (
						_ message: FiltersUpdate,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Get filters index
	func getFiltersIndex (
						_ message: EmptyValue,
						_ promise: @escaping (FiltersIndex) -> Void) -> Void
	/// Update custom filter
	func updateCustomFilter (
						_ message: CustomFilterUpdateRequest,
						_ promise: @escaping (OptionalError) -> Void) -> Void
	/// Request update on filter library, result will be dispatch by
	/// TrayCallbackService.OnFilterStatusResolved
	func requestFiltersUpdate (
						_ message: EmptyValue,
						_ promise: @escaping (EmptyValue) -> Void) -> Void
	/// Request filters divided by safari extension
	func getFiltersGroupedByExtensions (
						_ message: EmptyValue,
						_ promise: @escaping (FiltersGroupedByExtensions) -> Void) -> Void
	/// Update language specific
	func updateLanguageSpecific (
						_ message: BoolValue,
						_ promise: @escaping (EmptyValue) -> Void) -> Void
}

// MARK: Protobuf Bridge definition
// It is base class for custom service class with type `FiltersService.ServiceType`

/// Service handles about app information
open class FiltersService: SciterBridge
{
	public override var serviceName: String { "FiltersService" }
    public typealias ServiceType = FiltersService & Service & FiltersServiceProtocol

	/// Wrapper for `GetFiltersMetadata`
	@objc func GetFiltersMetadata(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: Filters.self,
			method: cast.getFiltersMetadata(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `GetEnabledFiltersIds`
	@objc func GetEnabledFiltersIds(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: FiltersEnabledIds.self,
			method: cast.getEnabledFiltersIds(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `CheckCustomFilter`
	@objc func CheckCustomFilter(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: Path.self,
			outputType: FilterOrError.self,
			method: cast.checkCustomFilter(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `ConfirmAddCustomFilter`
	@objc func ConfirmAddCustomFilter(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: CustomFilterToAdd.self,
			outputType: OptionalError.self,
			method: cast.confirmAddCustomFilter(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `DeleteCustomFilters`
	@objc func DeleteCustomFilters(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: CustomFiltersToDelete.self,
			outputType: OptionalError.self,
			method: cast.deleteCustomFilters(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `UpdateFilters`
	@objc func UpdateFilters(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: FiltersUpdate.self,
			outputType: OptionalError.self,
			method: cast.updateFilters(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `GetFiltersIndex`
	@objc func GetFiltersIndex(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: FiltersIndex.self,
			method: cast.getFiltersIndex(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `UpdateCustomFilter`
	@objc func UpdateCustomFilter(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: CustomFilterUpdateRequest.self,
			outputType: OptionalError.self,
			method: cast.updateCustomFilter(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `RequestFiltersUpdate`
	@objc func RequestFiltersUpdate(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: EmptyValue.self,
			method: cast.requestFiltersUpdate(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `GetFiltersGroupedByExtensions`
	@objc func GetFiltersGroupedByExtensions(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: EmptyValue.self,
			outputType: FiltersGroupedByExtensions.self,
			method: cast.getFiltersGroupedByExtensions(_:_:),
			message,
			promise
		)
	}

	/// Wrapper for `UpdateLanguageSpecific`
	@objc func UpdateLanguageSpecific(_ message: Data, promise: @escaping (Data) -> Void)
	{
		swiftCall(
			inputType: BoolValue.self,
			outputType: EmptyValue.self,
			method: cast.updateLanguageSpecific(_:_:),
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