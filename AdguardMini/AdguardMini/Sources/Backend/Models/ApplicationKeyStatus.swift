// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ApplicationKeyStatus.swift
//  AdguardMini
//

extension AppStatusInfo {
    enum ApplicationKeyStatus: String {
        case notExists
        case expired
        case maxComputersExceed
        case blocked
        case valid
    }
}
