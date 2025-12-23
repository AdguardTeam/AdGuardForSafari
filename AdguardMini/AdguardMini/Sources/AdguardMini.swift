// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AdguardMini.swift
//  AdguardMini
//

import Foundation
import SciterSwift
import SciterSDKAdapter
import AML

private enum Constants {
    static let sciterLogFuncName = "Sciter"
}

extension SciterSwift.App {
    /// Getter for nswindow of sciter
    public var nswindow: NSWindow? {
        self.window?.nswindow
    }

    /// Configure sciter bundle
    static func configureAndLoadBundle(hardwareAcceleration: Bool) -> Bool {
        Config.setup(gfx: .skiaMetal) { logLevel, msg in
            switch logLevel {
            case .info:
                LogInfo(msg, function: Constants.sciterLogFuncName)
            case .warn:
                LogWarn(msg, function: Constants.sciterLogFuncName)
            case .error:
                LogError(msg, function: Constants.sciterLogFuncName)
            @unknown default:
                LogDebug(msg, function: Constants.sciterLogFuncName)
            }
        }

        return load()
    }

    /// Load resources package
    static func load() -> Bool {
        guard let resourcesUrl = Bundle.main.url(forResource: "resources", withExtension: "bin")
        else {
            fatalError("Cannot load sciter bundle: resources.bin is not exist")
        }

        return Config.loadArchive(fileUrl: resourcesUrl)
    }

    static func shutdown() {
        Config.shutdown()
    }
}
