// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersUpdateService.swift
//  AdguardMini
//

import Foundation

import AML
import FLM

// MARK: - FiltersUpdateService

protocol FiltersUpdateService: RestartableService {
    func rescheduleTimer()
}

// MARK: - FiltersUpdateServiceImpl

final class FiltersUpdateServiceImpl: RestartableService, FiltersUpdateService {
    private let lock = UnfairLock()

    private let filters: FLMProtocol
    private let modeProvider: FiltersUpdateModeProvider

    private(set) var isStarted: Bool = false

    init(filters: FLMProtocol, modeProvider: FiltersUpdateModeProvider) {
        self.filters = filters
        self.modeProvider = modeProvider
    }

    func start() {
        locked(self.lock) {
            self.isStarted = true
        }
    }

    func stop() {
        locked(self.lock) {
            self.isStarted = false
            self.filters.stopPeriodicalUpdates()
        }
    }

    func rescheduleTimer() {
        let mode = self.modeProvider.currentMode

        self.filters.stopPeriodicalUpdates()

        if self.isStarted, mode != .disabled {
            let intervals = mode.intervals
            self.filters.startPeriodicalUpdatesWith(
                diffUpdatePeriod: intervals.diffPeriod,
                fullUpdatePeriod: intervals.fullPeriod
            )
        }
    }
}
