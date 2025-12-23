// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEToggle.Style.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - Constants

fileprivate enum Constants {
    static var size: CGSize { CGSize(width: 48, height: 28) }

    static var rightOffset: CGFloat { Space.smallPlus }
    static var leftOffset: CGFloat { -Self.rightOffset }
}

// MARK: - SEToggle.Style

extension SEToggle {
    struct Style {
        let isHovering: Bool
        let toggleConfiguration: Configuration
    }
}

// MARK: - SEToggle + ToggleStyle

extension SEToggle.Style: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button(action: { configuration.isOn.toggle() }) {
            RoundedRectangle(
                cornerRadius: Radius.large,
                style: .circular
            )
            .fill(
                self.color(for: configuration)
            )
            .frame(size: Constants.size)
            .overlay(
                Circle()
                    .fill(self.toggleConfiguration.appearance.circleColor.enabledColor)
                    .padding(Space.tiny)
                    .offset(
                        x: configuration.isOn
                        ? Constants.rightOffset
                        : Constants.leftOffset
                    )
            )
        }
        .buttonStyle(.plain)
        .disabled(!self.toggleConfiguration.isEnabled)
    }

    private func color(for configuration: Configuration) -> Color {
        let appearance = self.toggleConfiguration.appearance
        let isEnabled = self.toggleConfiguration.isEnabled
        let color = configuration.isOn ? appearance.onColor : appearance.offColor

        return if self.isHovering {
            color.hoveredColor
        } else {
            isEnabled ? color.enabledColor : color.disabledColor
        }
    }
}
