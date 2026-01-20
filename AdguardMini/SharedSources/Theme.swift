// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ThemeOption.swift
//  AdguardMini
//

/// Possible options for application color theme.
@objc
enum Theme: Int, Codable {
    // - Important: Don't change places of cases. It will broke stored value
    /// System configured color theme.
    case system
    /// Light color theme.
    case light
    /// Dark color theme.
    case dark
}
