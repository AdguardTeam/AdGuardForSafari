// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  NSWorkspace.OpenConfiguration+Silent.swift
//  AdguardMini
//

import AppKit

extension NSWorkspace.OpenConfiguration {
    /// Configuration for launching an app without bringing it to the foreground.
    ///
    /// Use this when the app needs to be started in the background (e.g., from
    /// a Safari extension or a helper tool) to avoid stealing focus from the
    /// current user context.
    ///
    /// Returns a fresh instance on every access: the configuration is a mutable
    /// AppKit object, so a shared one would be shared mutable state.
    static var silent: NSWorkspace.OpenConfiguration {
        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = false
        configuration.addsToRecentItems = false
        configuration.hides = true
        configuration.createsNewApplicationInstance = false
        return configuration
    }

    /// Configuration for launching an app and bringing its window to the foreground.
    ///
    /// Use this when opening UI (e.g., settings or purchase window) from a Safari
    /// extension so that the window is visible on top of Safari.
    ///
    /// Returns a fresh instance on every access: the configuration is a mutable
    /// AppKit object, so a shared one would be shared mutable state.
    static var foreground: NSWorkspace.OpenConfiguration {
        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = true
        configuration.addsToRecentItems = false
        configuration.hides = false
        configuration.createsNewApplicationInstance = false
        return configuration
    }
}
