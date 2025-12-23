// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariBlockerType+contentBlockingPath(App).swift
//  AdguardMini
//

import FilterEngine

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
        case .advanced:                   "\(Schema.BASE_DIR)/\(Schema.RULES_FILE_NAME)"
        }
    }
}
