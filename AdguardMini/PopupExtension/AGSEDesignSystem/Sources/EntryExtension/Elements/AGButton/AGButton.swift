// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - Constants

fileprivate enum Constants {
    static let elementSize = Size.expanded
}

// MARK: - AGButton

struct AGButton: View {
    // MARK: Private properties

    @State private var isHovering: Bool = false

    // MARK: Public properties

    var configuration: Configuration
    var action: () -> Void = {}

    // MARK: Init

    init(
        configuration: Configuration,
        action: @escaping () -> Void = {}
    ) {
        self.configuration = configuration
        self.action = action
    }

    // MARK: UI

    var body: some View {
        SEButton(
            configuration: .init(
                appearance: self.configuration.buttonAppearance,
                isEnabled: self.configuration.state.isEnabled && !self.configuration.state.isLoading
            ),
            action: self.action
        ) {
            expandableButtonBody
        }
        .onHover { onHover in
            self.isHovering = onHover
        }
    }

    @ViewBuilder
    private var expandableButtonBody: some View {
        HStack {
            if self.configuration.appearance.autoExpanded {
                Spacer()
            }
            self.buttonBody
            if self.configuration.appearance.autoExpanded {
                Spacer()
            }
        }
        .font(self.configuration.appearance.font)
        .foregroundColor(self.fontColor())
        .padding(self.configuration.appearance.paddings)
        .frame(height: self.configuration.appearance.height)
    }

    @ViewBuilder
    private var buttonBody: some View {
        if self.configuration.state.isLoading {
            self.loaderBody
        } else {
            self.contentBody
        }
    }

    @ViewBuilder
    private var loaderBody: some View {
        HStack {
            if let text = self.configuration.content.text {
                Text(text)
            }
        }
    }

    @ViewBuilder
    private var contentBody: some View {
        if let leftIcon = self.configuration.content.leftIcon {
            leftIcon
                .frame(size: Constants.elementSize)
            if self.configuration.content.text != nil {
                Spacer()
                    .frame(width: Space.small)
            }
        }

        if let text = self.configuration.content.text {
            Text(text)
        }
    }

    // MARK: Private methods

    private func fontColor() -> Color {
        guard self.configuration.state.isEnabled,
              !self.configuration.state.isLoading
        else {
            return self.configuration.appearance.fontColor.disabledColor
        }

        return self.isHovering
        ? self.configuration.appearance.fontColor.hoveredColor
        : self.configuration.appearance.fontColor.enabledColor
    }
}
