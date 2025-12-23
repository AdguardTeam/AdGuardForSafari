// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExtensionStatus.swift
//  AdguardMini
//

import Foundation

extension SafariExtension {
    /// Status of Safari extension / content blocker.
    enum Status {
        case unknown
        case ok
        case loading
        case disabled
        case limitExceeded
        case converterError
        case safariError
    }
}
