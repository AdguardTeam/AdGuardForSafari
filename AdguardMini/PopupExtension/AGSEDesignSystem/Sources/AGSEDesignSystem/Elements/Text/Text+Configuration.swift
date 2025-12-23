// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Text+Configuration.swift
//  AGSEDesignSystem
//

import SwiftUI

extension Text {
    func textStyle(_ configuration: Configuration) -> some View {
        self
            .font(configuration.font)
            .foregroundColor(configuration.color.enabledColor)
            .lineLimit(configuration.isMultiline ? nil : 0)
            .if(configuration.isMultiline) { text in
                text
                    .multilineTextAlignment(configuration.multilineTextAlignment)
                    .frame(maxWidth: .infinity, alignment: configuration.alignment)
                    .fixedSize(horizontal: false, vertical: true)
            }
    }
}
