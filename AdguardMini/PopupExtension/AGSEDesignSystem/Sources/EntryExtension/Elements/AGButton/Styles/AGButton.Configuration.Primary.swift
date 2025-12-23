// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.Primary.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - AGButton.Configuration.Primary

extension AGButton.Configuration {
    static func primary(
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
                fontColor: Palette.PrimaryButton.Main.font
            ),
            buttonAppearance: .init(
                cornerRadius: size.cornerRadius,
                backgroundColor: Palette.PrimaryButton.Main.background
            ),
            state: state
        )
    }
}

// MARK: - PrimaryAGButtonButton_Previews

struct PrimaryAGButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            AGButton(
                configuration:
                        .primary(text: "Enable")
            )
            AGButton(
                configuration:
                        .primary(
                            text: "Disable",
                            state: .init(isEnabled: false, isLoading: false)
                        )
            )
            AGButton(
                configuration:
                        .primary(
                            text: "Enable",
                            state: .init(isLoading: true)
                        )
            )
        }
        .frame(width: 320)
        .padding(16)
    }
}
