// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LicenseStatus.swift
//  AdguardMini
//

import Foundation

extension AppStatusInfo {
    public enum LicenseStatus: String {
        case active
        case trial
        case free
        case blockedAppId
        case expired
        case uninstall
        case wrongKey
        case alreadyActivate
        case blocked
    }
}
