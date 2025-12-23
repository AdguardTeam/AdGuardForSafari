// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupCell.Configuration.swift
//  AGSEDesignSystem
//

import SwiftUI

extension PopupCell {
    struct Configuration {
        var content: Content
        var appearance: Appearance
        var isEnabled: Bool

        init(
            content: Content,
            appearance: Appearance,
            isEnabled: Bool = true
        ) {
            self.content = content
            self.appearance = appearance
            self.isEnabled = isEnabled
        }
    }
}
