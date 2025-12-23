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

// MARK: - Constants

private enum Constants {
    /// 72 hours (or from devConfig)
    static let requiredDuration: TimeInterval = {
        if let seconds = DeveloperConfigUtils[.rateUsRequiredDuration] as? Int {
            return TimeInterval(seconds)
        }
        return 72.hours
    }()

    /// 1 hour (or from devConfig)
    static let checkInterval: TimeInterval = {
        if let seconds = DeveloperConfigUtils[.rateUsCheckInterval] as? Int {
            return TimeInterval(seconds)
        }
        return 1.hour
    }()
}

// MARK: - AppStoreRateUs

protocol AppStoreRateUs {
    func startMonitoring()
    func stopMonitoring()
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
    private var timer: DispatchSourceTimer?

    init(appMetadata: AppMetadata) {
        self.appMetadata = appMetadata
    }

    deinit {
        self.stopMonitoring()
    }

    func startMonitoring() {
        self.stopMonitoring()

        LogInfo("Start monitoring rate us")

        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now(), repeating: Constants.checkInterval)
        timer.setEventHandler { [weak self] in
            self?.checkAndRequestReviewIfNeeded()
        }

        self.timer = timer
        timer.resume()
    }

    func stopMonitoring() {
        LogInfo("Stop monitoring rate us")
        self.timer?.cancel()
        self.timer = nil
    }

    private func checkAndRequestReviewIfNeeded() {
        guard let protectionEnabledDate = self.appMetadata.rateUsProtectionEnabledDate,
              let noCrashesDate = self.appMetadata.rateUsNoCrashesDate
        else {
            let missing = [
                self.appMetadata.rateUsProtectionEnabledDate == nil ? "protectionEnabledDate" : nil,
                self.appMetadata.rateUsNoCrashesDate == nil ? "noCrashesDate" : nil
            ].compactMap { $0 }.joined(separator: ", ")
            LogDebug("Rate us check skipped: missing \(missing)")
            return
        }

        let now = Date.now
        let protectionDuration = now.timeIntervalSince(protectionEnabledDate)
        let noCrashesDuration = now.timeIntervalSince(noCrashesDate)

        guard protectionDuration >= Constants.requiredDuration,
              noCrashesDuration >= Constants.requiredDuration
        else {
            LogDebug("Conditions not met yet. Protection: \(protectionDuration.fullHours)h, No crashes: \(noCrashesDuration.fullHours)h")
            return
        }

        LogInfo("Conditions met! Protection: \(protectionDuration.fullHours)h, No crashes: \(noCrashesDuration.fullHours)h")

        self.stopMonitoring()

        Task { @MainActor in
            self.callRateUs()
        }

        self.appMetadata.rateUsProtectionEnabledDate = .now
        self.appMetadata.rateUsNoCrashesDate = .now

        self.startMonitoring()
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
