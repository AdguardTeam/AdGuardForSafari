// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SubscribeWebFlowServiceError.swift
//  AdguardMini
//

import Foundation

/// Possible account service errors.
enum SubscribeWebFlowServiceError: Error {
    /// Can't create url from provided data.
    case cantCreateUrl
}
