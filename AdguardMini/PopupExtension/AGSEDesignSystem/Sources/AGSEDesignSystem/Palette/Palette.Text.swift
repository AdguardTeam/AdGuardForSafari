// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Palette.Text.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - Palette.Text

extension Palette {
    enum Text {
        static let mainText = StatefulColor(
            enabledColor: Palette.textMainTextMainDefault,
            disabledColor: Palette.textMainTextMainDisabled,
            pressedColor: Palette.textMainTextMainDefault,
            hoveredColor: Palette.textMainTextMainDefault
        )
        static let description = StatefulColor(
            enabledColor: Palette.textDescriptionDescriptionDefault,
            disabledColor: Palette.textDescriptionDescriptionDisabled,
            pressedColor: Palette.textDescriptionDescriptionDefault,
            hoveredColor: Palette.textDescriptionDescriptionDefault
        )
        static let attention = StatefulColor(
            enabledColor: Palette.textLinksAttentionLinkDefault,
            disabledColor: Palette.textLinksAttentionLinkDisabled,
            pressedColor: Palette.textLinksAttentionLinkDefault,
            hoveredColor: Palette.textLinksAttentionLinkDefault
        )
    }
}

// MARK: - PaletteText_Previews

#Preview("Text colors") {
    func mainText() -> some View {
        VStack {
            Text("Text.mainText.enabled: Hello, Word!")
                .foregroundColor(Palette.Text.mainText.enabledColor)
            Text("Text.mainText.disabled: Hello, Word!")
                .foregroundColor(Palette.Text.mainText.disabledColor)
        }
    }

    func descriptionText() -> some View {
        VStack {
            Text("Text.description.enabled: Hello, Word!")
                .foregroundColor(Palette.Text.description.enabledColor)
            Text("Text.description.disabled: Hello, Word!")
                .foregroundColor(Palette.Text.description.disabledColor)
        }
    }

    func attentionText() -> some View {
        VStack {
            Text("Text.attention.enabled: Hello, Word!")
                .foregroundColor(Palette.Text.attention.enabledColor)
            Text("Text.attention.disabled: Hello, Word!")
                .foregroundColor(Palette.Text.attention.disabledColor)
        }
    }

    return VStack(spacing: 16) {
        mainText()
        descriptionText()
        attentionText()
    }
    .padding()
}
