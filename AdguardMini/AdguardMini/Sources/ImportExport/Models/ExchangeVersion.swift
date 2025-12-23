// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeProtocol.swift
//  AdguardMini
//

import Foundation

// MARK: Versions for import/export
enum ExchangeVersions: String, Codable {
    case
    legacy = "1.0",
    one = "1"
}

// MARK: Structure that saves as JSON and describes version of import/export setttings archive

struct ExchangeVersion: Codable {
    let version: ExchangeVersions
}
