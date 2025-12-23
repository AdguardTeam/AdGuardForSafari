// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.Attention.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - AGButton.Configuration.Attention

extension AGButton.Configuration {
    static func attention(
        text: String,
        size: AGButton.Size = .init(),
        state: AGButton.Configuration.State = .init(isEnabled: true, isLoading: false)
    ) -> Self {
        .init(
            content: .init(text: text),
            appearance: .init(
                height: size.height,
                paddings: size.paddings,
                autoExpanded: true,
                font: Typography.Style.t1CondensedRegular.font,
                fontColor: Palette.PrimaryButton.Attention.font
            ),
            buttonAppearance: .init(
                cornerRadius: size.cornerRadius,
                backgroundColor: Palette.PrimaryButton.Attention.background
            ),
            state: state
        )
    }
}

// MARK: - AGButton.Configuration.attention

#Preview("Attention button style") {
    VStack {
        AGButton(
            configuration:
                    .attention(text: "Enable")
        )
        AGButton(
            configuration:
                    .attention(
                        text: "Disable",
                        state: .init(isEnabled: false, isLoading: false)
                    )
        )
        AGButton(
            configuration:
                    .attention(
                        text: "Enable",
                        state: .init(isLoading: true)
                    )
        )
    }
    .frame(width: 320)
    .padding(16)
}
