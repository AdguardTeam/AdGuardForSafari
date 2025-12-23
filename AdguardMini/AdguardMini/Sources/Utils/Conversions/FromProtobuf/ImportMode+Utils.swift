// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ImportMode+Utils.swift
//  AdguardMini
//

import Foundation
import SciterSchema

extension SciterSchema.ImportMode {
    func toSwift() -> ImportMode {
        // swiftlint:disable switch_case_on_newline
        switch self {
        case .full:             .full
        case .withoutAnnoyance: .withoutAnnoyance
        default:                .cancel
        }
        // swiftlint:enable switch_case_on_newline
    }
}
