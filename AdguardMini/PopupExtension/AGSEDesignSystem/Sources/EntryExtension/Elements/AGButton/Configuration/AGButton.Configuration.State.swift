// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AGButton.Configuration.State.swift
//  AGSEDesignSystem
//

extension AGButton.Configuration {
    struct State {
        var isEnabled: Bool
        var isLoading: Bool

        init(
            isEnabled: Bool = true,
            isLoading: Bool = false
        ) {
            self.isEnabled = isEnabled
            self.isLoading = isLoading
        }
    }
}
