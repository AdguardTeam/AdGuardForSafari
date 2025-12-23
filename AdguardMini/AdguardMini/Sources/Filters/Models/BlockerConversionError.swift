// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  BlockerConversionError.swift
//  AdguardMini
//

import Foundation

enum BlockerConversionError: Error {
    case noData
    case cantSave
    case cancelled
    case cantBuildAdvancedRules(Error)
    case unknown
}
