// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.Appearance.swift
//  AGSEDesignSystem
//

import SwiftUI

extension AGButton.Configuration {
    struct Appearance {
        var height: CGFloat?
        var paddings: EdgeInsets
        var autoExpanded: Bool
        var font: Font
        var fontColor: StatefulColor

        init(
            height: CGFloat? = nil,
            paddings: EdgeInsets,
            autoExpanded: Bool,
            font: Font,
            fontColor: StatefulColor
        ) {
            self.height = height
            self.paddings = paddings
            self.autoExpanded = autoExpanded
            self.font = font
            self.fontColor = fontColor
        }
    }
}
