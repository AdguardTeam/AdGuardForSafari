// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Typography.swift
//  AGSEDesignSystem
//

import SwiftUI

struct Typography {
    let fontStyle: FontStyle
    let fontSize: CGFloat

    var font: Font { fontStyle.font(for: fontSize) }
}
