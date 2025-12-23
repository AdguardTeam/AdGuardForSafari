// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionUpdate+Utils.swift
//  SciterSchema
//

import Foundation
import BaseSciterSchema

extension SafariExtensionUpdate {
    public init(
        type: SafariExtensionType,
        state: SafariExtension = SafariExtension()
    ) {
        self.init()
        self.type = type
        self.state = state
    }
}
