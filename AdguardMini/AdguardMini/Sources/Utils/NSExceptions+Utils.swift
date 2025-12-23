// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  NSExceptions+Utils.swift
//  AdguardMini
//

import Foundation
import AML

/// A set of NSError domains used when transforming Objective-C `NSException` into Swift `NSError` instances.
///
/// Use these values to semantically distinguish where an exception originated from (e.g., SafariServices) when wrapping it into an error.
enum NSExceptionDomain: String {
    case safariServices = "ExceptionDomainSafariServices"
}

/// Utilities for converting and logging Objective-C `NSException` values.
extension NSException {
    /// Converts the current `NSException` into an `NSError` with the provided domain.
    ///
    /// - Parameter domain: The error domain under which the exception will be wrapped.
    /// - Returns: An `NSError` containing the exception's name and reason in `userInfo`.
    func toNsError(domain: NSExceptionDomain) -> NSError {
        NSError(
            domain: domain.rawValue,
            code: 1,
            userInfo: [
                NSLocalizedDescriptionKey: self.reason ?? "Unknown reason",
                "NSExceptionName": self.name.rawValue
            ]
        )
    }

    /// Builds a multi-line, human-readable string representation of the exception,
    /// including its name, reason, user info, and the call stack.
    @inlinable @inline(__always)
    func logString() -> String {
        """
        NSException:
        - name: \(self.name.rawValue)
        - reason: \(self.reason ?? "nil")
        - userInfo: \(self.userInfo ?? [:])
        - callStack:
        \(self.callStackSymbols.joined(separator: "\n"))
        """
    }

    /// Transforms the exception into an `NSError`, logs detailed diagnostics, and returns the error.
    ///
    /// The log includes the exception name, reason, user info, and full call stack.
    ///
    /// - Parameters:
    ///   - domain: The `NSExceptionDomain` to use for the resulting `NSError`.
    ///   - file: The file where the exception was captured (defaults to `#fileID`).
    ///   - function: The function name where the exception was captured (defaults to `#function`).
    ///   - line: The line number where the exception was captured (defaults to `#line`).
    /// - Returns: The `NSError` constructed from this exception.
    func transformAndLog(
        domain: NSExceptionDomain,
        file: String = #fileID,
        function: String = #function,
        line: UInt = #line
    ) -> NSError {
        let error = self.toNsError(domain: domain)
        LogError(
            "Captured Obj-C exception (\(domain)): \(self.logString())",
            file: file,
            function: function,
            line: line
        )
        return error
    }
}
