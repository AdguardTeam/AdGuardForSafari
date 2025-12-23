// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtension+Utils.swift
//  SciterSchema
//

import Foundation
import BaseSciterSchema

extension SafariExtension {
    public init(
        id: String = "",
        rulesEnabled: Int32 = 0,
        rulesTotal: Int32 = 0,
        status: SafariExtensionStatus = .disabled,
        safariError: String? = nil
    ) {
        self.init()
        self.id = id
        self.rulesEnabled = rulesEnabled
        self.rulesTotal = rulesTotal
        self.status = status
        if let safariError {
            self.safariError = safariError
        }
    }
}
