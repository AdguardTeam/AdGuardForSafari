// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  QuitReaction.swift
//  AdguardMini
//

import Foundation

/// Possible options for responding to an app exit.
enum QuitReaction: Int, Codable {
    /// Ask if app should quit or run in background.
    case ask
    /// Quit app.
    case quit
    /// Keep app running in background.
    case keepRunning
}
