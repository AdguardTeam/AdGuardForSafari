// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupCell.Configuration.Content.swift
//  AGSEDesignSystem
//

import SwiftUI

extension PopupCell.Configuration {
    struct Content {
        var title: String
        var hint: String?
        var leftIcon: Image

        init(
            title: String,
            hint: String? = nil,
            leftIcon: Image
        ) {
            self.title = title
            self.hint = hint
            self.leftIcon = leftIcon
        }
    }
}
