// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEButton.Style.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - SEButton.Style

extension SEButton {
    struct Style {
        let isHovering: Bool
        let buttonConfiguration: SEButtonConfiguration
    }
}

// MARK: - SEButton + ButtonStyle

extension SEButton.Style: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(backgroundColor(for: configuration))
            .frame(height: buttonConfiguration.appearance.height)
            .clipShape(RoundedRectangle(cornerRadius: buttonConfiguration.appearance.cornerRadius))
    }

    private func backgroundColor(for configuration: Configuration) -> some View {
        guard buttonConfiguration.isEnabled else {
            return buttonConfiguration.appearance.backgroundColor.disabledColor
        }

        var color: Color
        if configuration.isPressed {
            color = buttonConfiguration.appearance.backgroundColor.pressedColor
        } else {
            color = self.isHovering
            ? buttonConfiguration.appearance.backgroundColor.hoveredColor
            : buttonConfiguration.appearance.backgroundColor.enabledColor
        }
        return color
    }
}
