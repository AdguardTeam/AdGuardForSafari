// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Settings+Utils.swift
//  AdguardMini
//

import Foundation
import SciterSchema

extension SciterSchema.QuitReaction {
    func toQuitReaction() -> QuitReaction {
        switch self {
        case .ask:                    .ask
        case .keepRunning:            .keepRunning
        case .quit:                   .quit
        case .UNRECOGNIZED, .unknown: .ask
        }
    }
}

extension SciterSchema.Theme {
    func toTheme() -> Theme {
        switch self {
        case .system:                 .system
        case .light:                  .light
        case .dark:                   .dark
        case .UNRECOGNIZED, .unknown: .system
        }
    }
}
