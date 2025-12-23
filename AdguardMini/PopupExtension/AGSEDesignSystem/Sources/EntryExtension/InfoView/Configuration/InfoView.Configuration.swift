// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  InfoView.Configuration.swift
//  AGSEDesignSystem
//

import Foundation
import SwiftUI

extension InfoView {
    public struct Configuration {
        public var state: State
        public var image: Image
        public var baseContent: Content
        public var loadingContent: Content
        public var errorContent: Content

        public var action: () -> Void = {}

        public init(
            state: State,
            image: Image,
            baseContent: Content,
            loadingContent: Content,
            errorContent: Content,
            action: @escaping () -> Void = {}
        ) {
            self.state = state
            self.image = image
            self.baseContent = baseContent
            self.loadingContent = loadingContent
            self.errorContent = errorContent
            self.action = action
        }
    }
}
