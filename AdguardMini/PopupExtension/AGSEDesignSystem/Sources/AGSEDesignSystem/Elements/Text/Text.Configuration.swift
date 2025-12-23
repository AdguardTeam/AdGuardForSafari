// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEText.swift
//  AGSEDesignSystem
//

import SwiftUI

extension Text {
    struct Configuration {
        var font: Font
        var color: StatefulColor
        var isMultiline: Bool
        var alignment: Alignment
        var multilineTextAlignment: TextAlignment

        init(
            font: Font,
            color: StatefulColor,
            isMultiline: Bool,
            alignment: Alignment = .center,
            multilineTextAlignment: TextAlignment = .center
        ) {
            self.font = font
            self.color = color
            self.isMultiline = isMultiline
            self.alignment = alignment
            self.multilineTextAlignment = multilineTextAlignment
        }
    }
}
