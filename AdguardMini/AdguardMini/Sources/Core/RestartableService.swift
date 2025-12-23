// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  RestartableService.swift
//  AdguardMini
//

import Foundation
import AML

protocol RestartableService: AnyObject {
    var isStarted: Bool { get }

    func start()
    func stop()
}

/// Base class for services that can be started and stopped.
class RestartableServiceBase: RestartableService {
    private(set) var isStarted: Bool = false

    func start() {
        self.isStarted = true
        LogDebug("[\(type(of: self))] Started")
    }

    func stop() {
        self.isStarted = false
        LogDebug("[\(type(of: self))] Stopped")
    }
}
