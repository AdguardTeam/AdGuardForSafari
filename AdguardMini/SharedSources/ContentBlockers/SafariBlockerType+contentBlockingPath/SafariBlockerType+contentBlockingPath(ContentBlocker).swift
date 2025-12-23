// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Untitled.swift
//  AdguardMini
//

import AML

extension SafariBlockerType {
    /// Gets corresponding content-blocking.json path for groupKey value.
    var contentBlockingPath: String {
        switch self {
        case .general:                    Self.generalName
        case .privacy:                    Self.privacyName
        case .security:                   Self.securityName
        case .socialWidgetsAndAnnoyances: Self.socialWidgetsAndAnnoyancesName
        case .other:                      Self.otherName
        case .custom:                     Self.customName
        case .advanced:
            {
                LogError("Advanced rules is not supported in Content Blockers")
                assertionFailure("Advanced rules is not supported in Content Blockers")
                return ""
            }()
        }
    }
}
