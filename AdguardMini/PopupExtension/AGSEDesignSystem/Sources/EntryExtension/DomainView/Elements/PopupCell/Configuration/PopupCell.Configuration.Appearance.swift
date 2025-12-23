// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupCell.Configuration.Appearance.swift
//  AGSEDesignSystem
//

import SwiftUI

extension PopupCell.Configuration {
    struct Appearance {
        var titleConfiguration: Text.Configuration
        var hintConfiguration: Text.Configuration
        var leftIconColor: StatefulColor
        var paddings: EdgeInsets

        init(
            titleConfiguration: Text.Configuration,
            hintConfiguration: Text.Configuration,
            leftIconColor: StatefulColor,
            paddings: EdgeInsets = EdgeInsets(side: Margin.regular)
        ) {
            self.titleConfiguration = titleConfiguration
            self.hintConfiguration = hintConfiguration
            self.leftIconColor = leftIconColor
            self.paddings = paddings
        }
    }
}
