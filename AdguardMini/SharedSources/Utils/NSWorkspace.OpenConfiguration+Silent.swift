// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  NSWorkspace.OpenConfiguration+Silent.swift
//  AdguardMini
//

import AppKit

extension NSWorkspace.OpenConfiguration {
    static let silent: NSWorkspace.OpenConfiguration = {
        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = false
        configuration.addsToRecentItems = false
        configuration.hides = true
        configuration.createsNewApplicationInstance = false
        return configuration
    }()
}
