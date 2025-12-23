// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExtensionStateError.swift
//  AdguardMini
//

import Foundation

extension SafariExtension.State {
    enum ExtensionError: Error, Codable, Equatable {
        case converterError
        case safariError(String?)
    }
}

extension SafariExtension.State.ExtensionError {
    var message: String? {
        switch self {
        case .converterError:
            nil
        case .safariError(let message):
            message
        }
    }
}
