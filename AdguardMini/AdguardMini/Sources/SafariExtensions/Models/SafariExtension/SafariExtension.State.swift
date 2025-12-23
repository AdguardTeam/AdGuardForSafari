// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExtensionState.swift
//  AdguardMini
//

import Foundation

extension SafariExtension {
    struct State: Codable, Equatable {
        let rulesInfo: ConversionInfo
        let error: ExtensionError?

        init(rulesInfo: ConversionInfo, error: ExtensionError? = nil) {
            self.rulesInfo = rulesInfo
            self.error = error
        }
    }
}

extension SafariExtension.State {
    static var empty: Self {
        .init(
            rulesInfo: .empty,
            error: nil
        )
    }
}
