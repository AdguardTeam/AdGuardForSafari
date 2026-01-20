// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  NSApplication+SetTheme.swift
//  AdguardMini
//

import Cocoa

extension NSApplication {
    @MainActor
    func setTheme(_ theme: Theme) async {
        NSApplication.shared.appearance = switch theme {
        case .system: nil
        case .light: .init(named: .aqua)
        case .dark:  .init(named: .darkAqua)
        }
    }
}
