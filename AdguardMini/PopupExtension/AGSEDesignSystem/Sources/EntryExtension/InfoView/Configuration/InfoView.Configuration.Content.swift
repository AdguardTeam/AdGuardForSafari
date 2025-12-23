// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  InfoView.Configuration.Content.swift
//  AGSEDesignSystem
//

import Foundation

extension InfoView.Configuration {
    public struct Content {
        public var title: String
        public var text: String
        public var buttonText: String

        public init(
            title: String,
            text: String,
            buttonText: String
        ) {
            self.title = title
            self.text = text
            self.buttonText = buttonText
        }
    }
}
