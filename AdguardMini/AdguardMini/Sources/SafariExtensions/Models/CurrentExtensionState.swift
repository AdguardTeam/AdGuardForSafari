// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  CurrentExtensionState.swift
//  AdguardMini
//

import Foundation

/// Full available info about Safari extension / content blocker.
struct CurrentExtensionState: Equatable {
    let type: SafariBlockerType
    let status: SafariExtension.Status
    let state: SafariExtension.State
}

extension CurrentExtensionState {
    static func loadingStatus(_ type: SafariBlockerType) -> Self {
        CurrentExtensionState(
            type: type,
            status: .loading,
            state: .empty
        )
    }
}
