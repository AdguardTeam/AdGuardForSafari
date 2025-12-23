// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  DomainView.Configuration.State.swift
//  AGSEDesignSystem
//

import Foundation

extension DomainView.Configuration {
    public struct State {
        public let isDisabled: Bool
        public let hasAttention: Bool

        public init(isDisabled: Bool, hasAttention: Bool) {
            self.isDisabled = isDisabled
            self.hasAttention = hasAttention
        }
    }
}
