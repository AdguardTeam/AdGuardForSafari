// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.Icon.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - AGButton.Configuration.Icon

extension AGButton.Configuration {
    static func icon(
        icon: Image,
        size: AGButton.Size = .init(
            height: Size.expanded.height,
            cornerRadius: Radius.zero,
            paddings: EdgeInsets(side: Margin.zero)
        ),
        isEnabled: Bool = true
    ) -> Self {
        .init(
            content: .init(
                leftIcon: icon
            ),
            appearance: .init(
                height: size.height,
                paddings: size.paddings,
                autoExpanded: false,
                font: Typography.Style.t3.font,
                fontColor: Palette.Icon.productIcon
            ),
            buttonAppearance: .init(
                height: size.height,
                cornerRadius: size.cornerRadius,
                backgroundColor: Color.clear.stateful
            ),
            state: .init(isEnabled: isEnabled)
        )
    }
}

// MARK: - PrimaryAGButtonButton_Previews

struct IconAGButton_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            VStack(spacing: Space.regular) {
                AGButton(
                    configuration:
                            .icon(icon: SEImage.Popup.settings)
                )

                AGButton(
                    configuration:
                            .icon(
                                icon: SEImage.Popup.settings,
                                isEnabled: false
                            )
                )
            }
        }
        .padding()
    }
}
