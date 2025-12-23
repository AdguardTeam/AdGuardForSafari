// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Color+Utils.swift
//  AGSEDesignSystem
//

import SwiftUI

extension Color {
    var stateful: StatefulColor {
        StatefulColor(
            enabledColor: self,
            disabledColor: self,
            pressedColor: self,
            hoveredColor: self
        )
    }
}
