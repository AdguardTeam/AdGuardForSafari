// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterOnboardingCallbackService.swift
//  AdguardMini
//

// MARK: - SciterOnboardingCallbackService

/// Service that sends data to the Sciter.
protocol SciterOnboardingCallbackService: RestartableService {
    /// Allows to send messages to Sciter.
    func start()

    /// Prevents messages from being sent to Sciter.
    func stop()
}
