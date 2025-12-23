// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LogConfig+SetLogLevel.swift
//  PopupExtension
//

import Foundation
import AML

extension LogConfig {
    static func setLogLevelAsyncly(_ logLevel: LogLevel) {
        DispatchQueue.main.async {
            if Logger.shared.logLevel != logLevel {
                LogInfo("Going to set log level to \(logLevel) (was \(Logger.shared.logLevel)")
                Logger.shared.logLevel = logLevel
            }
        }
    }
}
