// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EffectiveThemeValue+Utils.swift
//  AdguardMini
//

import BaseSciterSchema
import AML

extension EffectiveThemeValue {
    static var current: EffectiveThemeValue {
        UIUtils.isDarkMode() ? .dark : .light
    }
}
