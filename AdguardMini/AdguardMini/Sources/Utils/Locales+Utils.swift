// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Locales+Utils.swift
//  AdguardMini
//

import AML

extension Locales {
    static var userPreferredLanguages: [String] {
        var languages = [Locales.navigatorLang]
        languages.append(contentsOf: Locales.systemPreferredLanguages)
        return languages
    }
}
