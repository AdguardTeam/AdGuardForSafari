// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupCell.Configuration.Primary.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

extension PopupCell.Configuration {
    static func primary(
        content: Content,
        leftIconColor: StatefulColor,
        isEnabled: Bool
    ) -> Self {
        .init(
            content: content,
            appearance: .init(
                titleConfiguration: .popupCell(),
                hintConfiguration: .subtitle(
                    alignment: .leading,
                    multilineTextAlignment: .leading
                ),
                leftIconColor: leftIconColor
            ),
            isEnabled: isEnabled
        )
    }
}

#Preview("Primary cell") {
    func makeContent(
        hint: String? = nil
    ) -> PopupCell.Configuration.Content {
        .init(
            title: "Block element",
            hint: hint,
            leftIcon: SEImage.Popup.target
        )
    }

    let baseContent = makeContent()
    let fullContent = makeContent(hint: "Protection is off for this website as it may interfere with its operation")

    return VStack(spacing: 16) {
        PopupCell(
            configuration: .primary(
                content: baseContent,
                leftIconColor: Palette.Icon.errorIcon,
                isEnabled: true
            )
        )
        .border(Color.accentColor)

        PopupCell(
            configuration: .primary(
                content: baseContent,
                leftIconColor: Palette.Icon.errorIcon,
                isEnabled: false
            )
        )
        .border(Color.accentColor)

        PopupCell(
            configuration: .primary(
                content: fullContent,
                leftIconColor: Palette.Icon.errorIcon,
                isEnabled: true
            )
        )
        .border(Color.accentColor)

        PopupCell(
            configuration: .primary(
                content: fullContent,
                leftIconColor: Palette.Icon.errorIcon,
                isEnabled: false
            )
        )
        .border(Color.accentColor)
    }
    .frame(width: 320)
}
