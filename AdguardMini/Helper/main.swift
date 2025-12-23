// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  Helper
//

import Foundation
import AML
import XPCGateLib

let subsystem = Subsystem.helper

LogConfig.setupSharedLogger(for: subsystem)
LogInfo("Log level is \(Logger.shared.logLevel)")

SharedSentryUtilities.startSentryForPlugin(subsystem: subsystem)

let gate = XPCGate(codeSigningRequirement: BuildConfig.AG_HELPER_REQ)

let gateListener = XPCListener(name: subsystem.name, delegate: gate)
gateListener.resume()
LogInfo("XPCGate resumed with name \(subsystem.name)")

Task.detached {
    await launchMainAppAtLoginIfNeedIt()
}

LogInfo("Helper \(BuildConfig.AG_BUILD) has been initialized")

dispatchMain()
