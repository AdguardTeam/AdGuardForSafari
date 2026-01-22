// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AppStoreRateUs.swift
//  AdguardMini
//

import Foundation
import StoreKit
import SwiftUI
import AML

// MARK: - AppStoreRateUs

protocol AppStoreRateUs {
    func onWindowOpened()
}

// MARK: - ReviewRequester

private final class ReviewRequester {
    static let shared = ReviewRequester()

    @available(macOS 13.0, *)
    @MainActor
    func requestReview() {
        guard let window = NSApplication.shared.windows.first else {
            LogWarn("Review request skipped: no windows")
            return
        }

        let vc = self.ensureContentViewController(for: window)
        LogInfo("Requesting App Store review")
        AppStore.requestReview(in: vc)
    }

    @MainActor
    private func ensureContentViewController(for window: NSWindow) -> NSViewController {
        if let existing = window.contentViewController {
            LogDebug("Using existing window.contentViewController: \(type(of: existing)).")
            return existing
        }

        let wrapper = NSViewController()
        wrapper.view = window.contentView ?? NSView()

        window.contentViewController = wrapper
        LogInfo("Installed wrapper NSViewController as window.contentViewController")
        return wrapper
    }
}

// MARK: - AppStoreRateUsImpl

final class AppStoreRateUsImpl: AppStoreRateUs {
    private let appMetadata: AppMetadata
    private var debounceTask: Task<Void, Never>?
    private let debounceDelay: TimeInterval = 1.5

    init(appMetadata: AppMetadata) {
        self.appMetadata = appMetadata
    }

    func onWindowOpened() {
        guard self.canShowRateUs() else {
            return
        }

        self.debounceTask?.cancel()
        self.debounceTask = Task {
            try? await Task.sleep(seconds: self.debounceDelay)

            guard !Task.isCancelled else {
                LogDebug("Rate us request cancelled by debouncer")
                return
            }

            await self.callRateUs()
            self.advanceToNextStage()
        }
    }

    private func canShowRateUs() -> Bool {
        guard let noCrashesDate = appMetadata.rateUsNoCrashesDate else {
            LogDebug("Rate us check skipped: missing noCrashesDate")
            return false
        }

        let currentStage = self.appMetadata.rateUsStage
        let elapsed = Date.now.timeIntervalSince(noCrashesDate)

        let canShow = elapsed >= currentStage.interval

        if canShow {
            LogInfo("Rate us conditions met: stage=\(currentStage), elapsed=\(elapsed.fullHours)h")
        } else {
            LogDebug("Rate us conditions not met: stage=\(currentStage), elapsed=\(elapsed.fullHours)h, required=\(currentStage.interval.fullHours)h")
        }

        return canShow
    }

    private func advanceToNextStage() {
        let currentStage = self.appMetadata.rateUsStage
        self.appMetadata.rateUsStage = currentStage.next
        self.appMetadata.rateUsNoCrashesDate = .now
        LogInfo("Rate us stage advanced: \(currentStage) → \(currentStage.next)")
    }

    @MainActor
    private func callRateUs() {
        if #available(macOS 13.0, *) {
            LogInfo("Call rate us")
            ReviewRequester.shared.requestReview()
        } else {
            LogInfo("Call legacy rate us")
            SKStoreReviewController.requestReview()
        }
    }
}

private extension TimeInterval {
    var fullHours: Int {
        Int(self / 1.hour)
    }
}
