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
        // `LogLevel` is an immutable raw-value enum; the copy is only read.
        nonisolated(unsafe) let level = logLevel
        DispatchQueue.main.async {
            if Logger.shared.logLevel != level {
                LogInfo("Going to set log level to \(level) (was \(Logger.shared.logLevel)")
                Logger.shared.logLevel = level
            }
        }
    }
}
