// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Typography.FontStyle.swift
//  AGSEDesignSystem
//

import SwiftUI

extension Typography {
    public enum FontStyle {
        case sfPro
        case sfProBold
        case sfProDisplay
        case sfProDisplaySemibold

        func font(for size: CGFloat) -> Font {
            switch self {
            case .sfPro:
                return Font.system(size: size)
            case .sfProBold:
                return Font.system(size: size, weight: .bold)
            case .sfProDisplay:
                return Font.system(size: size)
            case .sfProDisplaySemibold:
                return Font.system(size: size, weight: .semibold)
            }
        }
    }
}
