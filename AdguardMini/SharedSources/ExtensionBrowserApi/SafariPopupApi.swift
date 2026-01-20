// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariPopupApi.swift
//  AdguardMini
//

import Foundation
import AML

/// API that Safari Popup exported.
@objc
protocol SafariPopupApi: AnyObject {
    func appStateChanged(_ appState: EBAAppState)
    func setLogLevel(_ logLevel: LogLevel)
    func setTheme(_ theme: Theme)
}
