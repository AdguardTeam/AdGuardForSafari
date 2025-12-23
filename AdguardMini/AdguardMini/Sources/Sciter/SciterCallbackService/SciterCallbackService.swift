// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterCallbackService.swift
//  AdguardMini
//

// MARK: - SciterCallbackService

/// Service that sends data to the Sciter.
protocol SciterCallbackService: RestartableService {
    /// Allows to send messages to Sciter.
    func start()

    /// Prevents messages from being sent to Sciter.
    func stop()
}
