// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupView.Layout.swift
//  EntryExtension
//

import Foundation

extension PopupView {
    enum Layout {
        case domain
        case adguardNotLaunched
        case protectionIsDisabled
        case somethingWentWrong
        case onboardingWasntCompleted
    }
}
