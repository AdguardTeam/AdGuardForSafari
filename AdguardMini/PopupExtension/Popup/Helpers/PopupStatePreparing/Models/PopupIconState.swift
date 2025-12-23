// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupIconState.swift
//  PopupExtension
//

import class AppKit.NSImage

/// Data that represents current Popup toolbar icon state.
struct PopupIconState {
    /// Responsible for whether the toolbar icon is clickable ("enabled") or not.
    let enabled: Bool
    /// Image for current state.
    let toolbarImage: NSImage
    /// Message for toolbar validation handler. See ``SFSafariExtensionHandler.validateToolbarItem``
    let message: String

    init(enabled: Bool, toolbarImage: NSImage, message: String = "") {
        self.enabled = enabled
        self.toolbarImage = toolbarImage
        self.message = message
    }
}
