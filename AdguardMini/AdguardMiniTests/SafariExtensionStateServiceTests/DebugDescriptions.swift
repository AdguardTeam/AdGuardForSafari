// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  DebugDescriptions.swift
//  AdguardMiniTests
//

// swiftlint:disable switch_case_on_newline

import Foundation

extension SafariExtension.Status: CustomDebugStringConvertible {
    var debugDescription: String {
        switch self {
        case .unknown:        "unknown"
        case .ok:             "ok"
        case .loading:        "loading"
        case .disabled:       "disabled"
        case .limitExceeded:  "limitExceeded"
        case .converterError: "converterError"
        case .safariError:    "safariError"
        }
    }
}

extension SafariBlockerType: CustomDebugStringConvertible {
    var debugDescription: String {
        switch self {
        case .general:                    "general"
        case .privacy:                    "privacy"
        case .security:                   "security"
        case .socialWidgetsAndAnnoyances: "socialWidgetsAndAnnoyances"
        case .other:                      "other"
        case .custom:                     "custom"
        case .advanced:                   "advanced"
        }
    }
}

extension SafariExtension.State.ExtensionError: CustomDebugStringConvertible {
    var debugDescription: String {
        switch self {
        case .converterError:
            "converterError"
        case .safariError(let error):
            "safariError(\(error?.description ?? "unknownError"))"
        }
    }
}

extension SafariExtension.State: CustomDebugStringConvertible {
    var debugDescription: String {
        """
        State(
                rulesInfo: \(self.rulesInfo)
                error: \(error?.debugDescription ?? "none")
            )
        """
    }
}

extension CurrentExtensionState: CustomDebugStringConvertible {
    var debugDescription: String {
        """
        CurrentExtensionState(
            type:   \(self.type)
            status: \(self.status)
            state:  \(self.state)
        )
        """
    }
}

// swiftlint:enable switch_case_on_newline
