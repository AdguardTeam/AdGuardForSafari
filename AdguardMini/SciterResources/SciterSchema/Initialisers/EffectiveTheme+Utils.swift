// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EffectiveTheme+Utils.swift
//  SciterSchema
//
//  Created by Pavel Kizin on 02.10.2025.
//

import Foundation
import BaseSciterSchema

extension EffectiveThemeValue {
    public init(_ value: EffectiveTheme = .light) {
        self.init()
        self.value = value
    }
    
    public static var dark: EffectiveThemeValue {
        Self(.dark)
    }

    public static var light: EffectiveThemeValue {
        Self(.light)
    }
}
