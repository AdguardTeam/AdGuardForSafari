// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ReloadExtensionResult.swift
//  AdguardMini
//

import Foundation

struct ReloadExtensionResult {
    let blockerType: SafariBlockerType
    let error: Error?
}
