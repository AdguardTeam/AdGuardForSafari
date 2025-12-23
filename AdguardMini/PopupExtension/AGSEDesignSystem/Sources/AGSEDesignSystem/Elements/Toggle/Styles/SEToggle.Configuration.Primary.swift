// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEToggle.Configuration.Primary.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - SEToggle.Configuration.Primary

extension SEToggle.Configuration {
    static func primary(isEnabled: Bool = true) -> Self {
        .init(
            appearance: .init(
                onColor: Palette.SwitchButton.onBackground,
                offColor: Palette.SwitchButton.offBackground,
                circleColor: Palette.SwitchButton.circle
            ),
            isEnabled: isEnabled
        )
    }
}

// MARK: - ToggleStylePrimary_Previews

#Preview {
    VStack {
        HStack {
            Text("Default")
            Spacer()
            SEToggle(
                isOn: .constant(false),
                configuration: .primary()
            )
            SEToggle(
                isOn: .constant(true),
                configuration: .primary()
            )
        }
        HStack {
            Text("Disabled")
            Spacer()
            SEToggle(
                isOn: .constant(false),
                configuration: .primary(isEnabled: false)
            )
            SEToggle(
                isOn: .constant(true),
                configuration: .primary(isEnabled: false)
            )
        }
    }
    .frame(width: 200)
    .padding()
}
