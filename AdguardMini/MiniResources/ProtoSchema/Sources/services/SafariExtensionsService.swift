// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/// This code was generated automatically by proto-parser tool version 1

import Foundation
import SwiftProtobuf

// WKWebView-only service bridge.

// MARK: Protocol definition

/// Shared service for Safari extension status and preferences across UI modules
/// YOU MUST IMPLEMENT THIS PROTOCOL USING CLASS WITH TYPE `SafariExtensionsService.ServiceType` IN SEPARATE SOURCE FILE
public protocol SafariExtensionsServiceProtocol
{
	/// Get Safari extension status
	func getSafariExtensions (
						_ message: EmptyValue,
						_ promise: sending @escaping (SafariExtensions) -> Void) -> Void
	/// Open Safari preferences
	func openSafariExtensionPreferences (
						_ message: OptionalStringValue,
						_ promise: sending @escaping (OptionalError) -> Void) -> Void
	/// Request reload content blockers
	func requestReloadContentBlockers (
						_ message: EmptyValue,
						_ promise: sending @escaping (EmptyValue) -> Void) -> Void
}

// MARK: Protobuf Bridge definition
// Base class for `SafariExtensionsService.ServiceType`.

/// Shared service for Safari extension status and preferences across UI modules
open class SafariExtensionsService: WebViewBridge
{
	public override var serviceName: String { "SafariExtensionsService" }
	public typealias ServiceType = SafariExtensionsService & Service & SafariExtensionsServiceProtocol

	/// WKWebView dispatch entry.
	public override func handleRequest(method: String, bytes: Data, promise: sending @escaping (Data) -> Void) {
		switch method {
		case "GetSafariExtensions":
			do {
				let input = try EmptyValue(serializedBytes: bytes)
				cast.getSafariExtensions(input) { result in
					do {
						promise(try result.serializedData())
					} catch {
						BridgeLog.error("SafariExtensionsService.GetSafariExtensions: failed to serialize reply: \(error)")
						promise(Data())
					}
				}
			} catch {
				BridgeLog.error("SafariExtensionsService.GetSafariExtensions: failed to deserialize request: \(error)")
				promise(Data())
			}
		case "OpenSafariExtensionPreferences":
			do {
				let input = try OptionalStringValue(serializedBytes: bytes)
				cast.openSafariExtensionPreferences(input) { result in
					do {
						promise(try result.serializedData())
					} catch {
						BridgeLog.error("SafariExtensionsService.OpenSafariExtensionPreferences: failed to serialize reply: \(error)")
						promise(Data())
					}
				}
			} catch {
				BridgeLog.error("SafariExtensionsService.OpenSafariExtensionPreferences: failed to deserialize request: \(error)")
				promise(Data())
			}
		case "RequestReloadContentBlockers":
			do {
				let input = try EmptyValue(serializedBytes: bytes)
				cast.requestReloadContentBlockers(input) { result in
					do {
						promise(try result.serializedData())
					} catch {
						BridgeLog.error("SafariExtensionsService.RequestReloadContentBlockers: failed to serialize reply: \(error)")
						promise(Data())
					}
				}
			} catch {
				BridgeLog.error("SafariExtensionsService.RequestReloadContentBlockers: failed to deserialize request: \(error)")
				promise(Data())
			}
		default:
			BridgeLog.error("SafariExtensionsService.handleRequest: unknown method \"\(method)\"")
			promise(Data())
		}
	}

	private var cast : ServiceType
	{
		if let service = self as? ServiceType {
			return service
		}

		fatalError("SafariExtensionsService instance must conform to its ServiceType protocol")
	}
}
