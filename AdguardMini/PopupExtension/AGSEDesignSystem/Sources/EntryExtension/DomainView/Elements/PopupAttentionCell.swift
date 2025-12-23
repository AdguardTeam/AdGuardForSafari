// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupAttentionCell.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - PopupAttentionCell

struct PopupAttentionCell: View {
    private let isEnabled = true
    var title: String
    var buttonText: String
    var action: () -> Void

    init(title: String, buttonText: String, action: @escaping () -> Void = {}) {
        self.title = title
        self.buttonText = buttonText
        self.action = action
    }

    var body: some View {
        VStack(spacing: Space.zero) {
            self.attention
            self.button
            .padding(
                EdgeInsets(
                    top: Margin.zero,
                    leading: Margin.regular,
                    bottom: Margin.regular,
                    trailing: Margin.regular
                )
            )
        }
    }

    private var attention: some View {
        PopupCell(
            configuration: .attention(
                title: self.title,
                isEnabled: self.isEnabled
            )
        )
    }

    private var button: some View {
        AGButton(
            configuration: .attention(
                text: self.buttonText,
                state: .init(
                    isEnabled: self.isEnabled
                )
            ),
            action: self.action
        )
    }
}

#Preview {
    VStack(spacing: 16) {
        PopupAttentionCell(
            title: "Some extensions are off",
            buttonText: "Fix it"
        )
        .border(Color.accentColor)
    }
    .frame(width: 320)
}
