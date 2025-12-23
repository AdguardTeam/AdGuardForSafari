// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEToggle.swift
//  AGSEDesignSystem
//

import SwiftUI

struct SEToggle: View {
    @State private var isHovering: Bool = false

    @Binding var isOn: Bool

    var configuration: Configuration

    var body: some View {
        Toggle(isOn: self.$isOn) {}
            .onHover { isHovering in
                self.isHovering = isHovering
            }
            .disabled(!self.configuration.isEnabled)
            .toggleStyle(
                Style(
                    isHovering: self.isHovering,
                    toggleConfiguration: self.configuration
                )
            )
    }
}
