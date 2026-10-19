// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SentryHelper.swift
//  AdguardMini
//

import Foundation
import AML
import AGSentry
import AGCrashReporterLib

// MARK: - SentryHelper

protocol SentryHelper {
    var onEndStart: (() -> Void) { get set }
    func startSentryAndContinueStartUp()
}

// MARK: - SentryHelperImpl

/// `@unchecked Sendable` because the helper's flags are best-effort guards
/// touched from the startup sequence and Sentry's event callback; the reset
/// flag is guarded by `resetLock` and `onEndStart` is assigned once at start-up.
final class SentryHelperImpl: SentryHelper, @unchecked Sendable {
    /// The crash reporter's reply address, persisted between runs.
    @UserDefault(key: .feedbackEmail, defaultValue: nil)
    private var feedbackEmail: String?

    private let appMetadata: AppMetadata
    private let appResetService: AppResetService

    /// Guards `isResetingAtStartUp`, which Sentry's callback thread and the
    /// main thread both touch.
    private let resetLock = UnfairLock()
    private var isResetingAtStartUp = false

    var onEndStart: (() -> Void) = {}

    init(appMetadata: AppMetadata, appResetService: AppResetService) {
        self.appMetadata = appMetadata
        self.appResetService = appResetService

        if self.appMetadata.rateUsNoCrashesDate.isNil {
            self.appMetadata.rateUsNoCrashesDate = .now
        }
    }

    deinit {
        LogDebug("\(self) deinit")
    }

    private func shouldSend(sentryEvent event: SentryEvent) -> Bool {
        self.appMetadata.rateUsNoCrashesDate = .now

        let resetInProgress = locked(self.resetLock) { self.isResetingAtStartUp }
        guard !resetInProgress else { return false }

        let crashedAppName = (event.isComponentEvent
                              ? .localized.base.crash_reporter_title_adguard_component
                              : BuildConfig.AG_APP_DISPLAYED_NAME)

        let email = self.feedbackEmail

        let reply = DispatchQueue.safeMainSync {
            SentryCrashReporter
                .callAdguardCrashReporter(
                    crashedAppName: crashedAppName,
                    windowTitle: self.makeWindowTitle(),
                    email: email,
                    watchedBid: BuildConfig.AG_APP_ID
                )
        }

        if !reply.email.isEmpty {
            self.feedbackEmail = reply.email
        }

        if reply.send {
            event.set(comment: reply.notes, email: reply.email)
        }

        if reply.reset {
            locked(self.resetLock) { self.isResetingAtStartUp = true }
            Task {
                if await !self.appResetService.resetApp(request: true) {
                    await MainActor.run {
                        locked(self.resetLock) { self.isResetingAtStartUp = false }
                        self.onEndStart()
                    }
                }
            }
        }

        let isResetting = locked(self.resetLock) { self.isResetingAtStartUp }
        return !isResetting && reply.send
    }

    private func makeWindowTitle() -> String {
        let mainAppName = BuildConfig.AG_APP_DISPLAYED_NAME
        let mainAppShortVersion = BuildConfig.AG_VERSION_TITLE

        return String(format: .localized.base.window_controller_crash_reporter, mainAppName, mainAppShortVersion)
    }
}

// MARK: - SentryHelper implementation

extension SentryHelperImpl {
    func startSentryAndContinueStartUp() {
        let completion = {
            DispatchQueue.main.async {
                let resetInProgress = locked(self.resetLock) { self.isResetingAtStartUp }
                if !resetInProgress {
                    self.onEndStart()
                }
            }
        }

        SharedSentryUtilities.startSentryForApp(
            completion: completion,
            shouldSend: self.shouldSend
        )
    }
}
