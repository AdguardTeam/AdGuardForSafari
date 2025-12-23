// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ServiceSupervisor.swift
//  AdguardMini
//

import Foundation

protocol ServiceSupervisor {
    var isStarted: Bool { get async }

    func startAll() async
    func stopAll() async
}

/// The object responsible for starting and stopping all services.
actor ServiceSupervisorImpl: ServiceSupervisor {
    private let filtersSupervisor: RestartableService

    private(set) var isStarted: Bool = false

    init(filtersSupervisor: FiltersSupervisor) {
        self.filtersSupervisor = filtersSupervisor
    }

    func startAll() {
        self.filtersSupervisor.start()
        self.isStarted = true
    }

    func stopAll() {
        self.isStarted = false
        self.filtersSupervisor.stop()
    }
}
