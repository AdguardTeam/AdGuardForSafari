// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ImportStatus+Utils.swift
//  SciterSchema
//

import Foundation
import BaseSciterSchema

extension ImportStatus {
    public init(success: Bool = false, filtersIds: [Int32] = []) {
        self.init()
        self.success = success
        self.filtersIds = filtersIds
    }
}
