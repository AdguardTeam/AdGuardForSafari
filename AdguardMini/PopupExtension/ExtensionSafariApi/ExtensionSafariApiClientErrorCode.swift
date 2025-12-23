// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExtensionSafariApiClientErrorCode.swift
//  PopupExtension
//

import Foundation

// MARK: - ExtensionSafariApiClientErrorCode

enum ExtensionSafariApiClientErrorCode: Error, CustomStringConvertible, Equatable {
    /// Posible parser error.
    case linkTimeout
    case other(Any?)

    var description: String {
        switch self {
        case .other(let any):
            if let obj = any as? String {
                return obj
            }
            if let obj = any as? NSError {
                return obj.description
            }
        case .linkTimeout:
            return "Can't connect to main app, timeout reached."
        }
        return "Unknown error occurred."
    }

    static func == (lhs: ExtensionSafariApiClientErrorCode, rhs: ExtensionSafariApiClientErrorCode) -> Bool {
        switch (lhs, rhs) {
        case (.linkTimeout, .linkTimeout):
            return true
        case
            (.other(let val1 as NSError), .other(let val2 as NSError)):
            return val1 == val2
        default:
            return false
        }
    }

    /// Returns error `value` if type is .other. In other cases returns self
    func raw() -> Any? {
        switch self {
        case let .other(value):
            return value
        default:
            return self
        }
    }
}
