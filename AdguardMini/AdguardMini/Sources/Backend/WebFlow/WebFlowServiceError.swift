// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WebFlowServiceError.swift
//  AdguardMini
//

import Foundation

/// Possible account service errors.
enum WebFlowServiceError: Error {
    /// Can't create url from provided data.
    case cantCreateUrl
    /// App has received the callback url, but cannot parse it into components.
    case cantParseCallbackUrl
}
