// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.Content.swift
//  AGSEDesignSystem
//

import SwiftUI

extension AGButton.Configuration {
    public struct Content {
        public var text: String?
        public var leftIcon: Image?

        public init(
            text: String? = nil,
            leftIcon: Image? = nil
        ) {
            self.text = text
            self.leftIcon = leftIcon
        }
    }
}
