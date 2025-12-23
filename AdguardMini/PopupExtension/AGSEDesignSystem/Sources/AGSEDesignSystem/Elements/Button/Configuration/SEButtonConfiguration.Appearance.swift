// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEButtonConfiguration.Appearance.swift
//  AGSEDesignSystem
//

import SwiftUI

extension SEButtonConfiguration {
    struct Appearance {
        var height: CGFloat?
        var cornerRadius: CGFloat
        var backgroundColor: StatefulColor

        init(
            height: CGFloat? = nil,
            cornerRadius: CGFloat,
            backgroundColor: StatefulColor
        ) {
            self.height = height
            self.cornerRadius = cornerRadius
            self.backgroundColor = backgroundColor
        }
    }
}
