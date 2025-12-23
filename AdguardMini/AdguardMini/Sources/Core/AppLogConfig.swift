// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppLogConfig.swift
//  AdguardMini
//

import Foundation
import AML

enum AppLogConfig {
    static func setup() {
        Logger.shared.handlers = [
            FileLogHandler(subsystem: BuildConfig.AG_APP_ID, filepath: LogConfig.groupLogfilePath),
            OSLogHandler(subsystem: BuildConfig.AG_APP_ID),
            LastErrorLogHandler()
        ]

        LogManager.shared = LogManager(
            handlers: [FileLogManager(logPath: LogConfig.groupLogfilePath)]
        )

        #if DEBUG
        Logger.shared.logLevel = .debug
        #else
        Logger.shared.logLevel = Keychain.debugLogging ? .debug : .info
        #endif
    }

    static func saveLastErrorMessage(_ msg: String) {
        UserDefaults.standard.set(msg, forKey: SettingsKey.lastError.rawValue)
    }

    static func getLastErrorMessage() -> String? {
        UserDefaults.standard.string(forKey: SettingsKey.lastError.rawValue)
    }

    static func resetLog() {
        LogManager.shared.resetLog()
    }
}

final class LastErrorLogHandler: LogHandlerProtocol {
    func log(level: LogLevel, date: Date, _ msg: String) {
        if level == .error {
            AppLogConfig.saveLastErrorMessage(msg)
        }
    }
}
