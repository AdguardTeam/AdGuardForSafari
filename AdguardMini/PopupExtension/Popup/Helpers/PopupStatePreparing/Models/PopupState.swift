// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupState.swift
//  PopupExtension
//

import class AppKit.NSImage

/// Data to determine the current state of the layout and popup icon.
struct PopupState {
    let popupIconState: PopupIconState
    let isProtectionEnabled: Bool
    let protectionForUrlState: ProtectionForUrlState
}
