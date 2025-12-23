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
        case .ask:          .ask
        case .keepRunning:  .keepRunning
        case .quit:         .quit
        case .UNRECOGNIZED, .unknown: .ask
        }
    }
}

extension SciterSchema.Settings {
    func toDTO() -> SettingsDTO {
        SettingsDTO(
            autoFiltersUpdate: self.autoFiltersUpdate,
            realTimeFiltersUpdate: self.realTimeFiltersUpdate,
            debugLogging: self.debugLogging,
            hardwareAcceleration: self.hardwareAcceleration,
            launchOnStartup: self.launchOnStartup,
            showInMenuBar: self.showInMenuBar,
            quitReaction: self.quitReaction.toQuitReaction()
        )
    }
}
