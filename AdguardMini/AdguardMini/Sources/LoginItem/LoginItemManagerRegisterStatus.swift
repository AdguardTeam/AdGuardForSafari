// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LoginItemManagerRegisterStatus.swift
//  AdguardMini
//

enum LoginItemManagerRegisterStatus {
    case notRegistered
    case enabled
    case requiresApproval
    case notFound
    case unexpected(String)
}
