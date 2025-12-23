// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  CurrentExtensionsStates.swift
//  AdguardMini
//

import Foundation

/// Full available info about all Safari extensions / content blockers.
struct CurrentExtensionsStates {
    let general: CurrentExtensionState
    let privacy: CurrentExtensionState
    let social: CurrentExtensionState
    let security: CurrentExtensionState
    let other: CurrentExtensionState
    let custom: CurrentExtensionState
    let advanced: CurrentExtensionState
}
