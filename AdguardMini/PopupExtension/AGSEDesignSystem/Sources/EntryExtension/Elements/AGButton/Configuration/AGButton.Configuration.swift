// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.swift
//  AGSEDesignSystem
//

import SwiftUI

extension AGButton {
    struct Configuration {
        var content: Content
        var appearance: Appearance
        var buttonAppearance: SEButtonConfiguration.Appearance
        var state: State

        init(
            content: Content,
            appearance: Appearance,
            buttonAppearance: SEButtonConfiguration.Appearance,
            state: State
        ) {
            self.content = content
            self.appearance = appearance
            self.buttonAppearance = buttonAppearance
            self.state = state
        }
    }
}
