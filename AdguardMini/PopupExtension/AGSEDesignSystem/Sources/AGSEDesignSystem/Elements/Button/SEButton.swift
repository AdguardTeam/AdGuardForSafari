// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEButton.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - SEButton

/// Base button for Safari Extension
struct SEButton<Content>: View where Content: View {
    // MARK: Private properties

    private let content: Content

    @State private var isHovering: Bool = false

    // MARK: Public properties

    var configuration: SEButtonConfiguration
    var action: () -> Void = {}

    // MARK: Init

    init(
        configuration: SEButtonConfiguration,
        action: @escaping () -> Void = {},
        @ViewBuilder content: () -> Content = { EmptyView() }
    ) {
        self.configuration = configuration
        self.action = action
        self.content = content()
    }

    // MARK: UI

    var body: some View {
        Button(action: self.action) {
            content
        }
        .onHover { isHovering in
            self.isHovering = isHovering
        }
        .disabled(!configuration.isEnabled)
        .buttonStyle(
            Style(
                isHovering: self.isHovering,
                buttonConfiguration: self.configuration
            )
        )
    }
}
