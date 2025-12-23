// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UpdaterController.swift
//  AdguardMini
//

import Cocoa
import Foundation

import AML
import AppBackend

// MARK: - UpdaterController

protocol UpdaterController {
    func checkForUpdate(silentCheck: Bool)
    func setAutoUpdate(autoUpdate: Bool)
}

#if !MAS

private enum Constants {
    static let updaterFeedKey = "SUFeedURL"
    static let updaterFeedCheckDataTimeout = TimeInterval(2.0)
    static let updaterFeedCheckWaitTimeout = TimeInterval(3.0)

    enum UpdateChannel: String {
        case nightly
        case beta
        case release

        init(rawValue: String) {
            switch rawValue {
            case Self.nightly.rawValue:
                self = .nightly
            case Self.beta.rawValue:
                self = .beta
            case Self.release.rawValue:
                self = .release
            default:
                self = .release
            }
        }

        var allowedChannels: Set<String> {
            switch self {
            case .nightly: [Self.nightlyChannelName, Self.betaChannelName]
            case .beta:    [Self.betaChannelName]
            case .release: []
            }
        }

        // Release channel is default and already exists. More info: https://sparkle-project.org/documentation/publishing/#channels
        private static let betaChannelName    = "beta"
        private static let nightlyChannelName = "nightly"
    }
}

import Sparkle

// MARK: - UpdaterControllerImpl

final class UpdaterControllerImpl: NSObject {
    private var updaterController: SPUStandardUpdaterController!
    private var onFoundUpdate: (String) -> Void
    private var onDidntFindUpdate: () -> Void
    private var onCancelUpdate: () -> Void
    private var willShowUpdate: () -> Void

    private var appcastFeedUrl = Bundle.main.infoDictionary?[Constants.updaterFeedKey] as? String
    private var updaterInUpdateState = false

    private let userSettings: UserSettingsManager = UserSettings()

    init(
        onFoundUpdate: @escaping (String) -> Void,
        onDidntFindUpdate: @escaping () -> Void,
        onCancelUpdate: @escaping () -> Void,
        willShowUpdate: @escaping () -> Void
    ) {
        self.onFoundUpdate = onFoundUpdate
        self.onDidntFindUpdate = onDidntFindUpdate
        self.onCancelUpdate = onCancelUpdate
        self.willShowUpdate = willShowUpdate

        super.init()
        self.updaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: self,
            userDriverDelegate: self
        )
        self.updaterController.startUpdater()
    }

    @discardableResult
    private func processError(error: Error?, function: String = #function, line: UInt = #line) -> UpdateErrorType? {
        guard let error = error as? NSError else { return nil }
        guard error.domain == SUSparkleErrorDomain else {
            LogError("Non-Sparkle error: \(error)", function: function, line: line)
            return .error
        }

        guard let baseError = SUError(rawValue: Int32(error.code)) else {
            LogError("Unknown Sparkle error: \(error)", function: function, line: line)
            return .error
        }

        switch baseError {
        case .noUpdateError,
             .installationAuthorizeLaterError:
            LogDebug("\(error)", function: function, line: line)
            return nil

        case .installationCanceledError:
            LogInfo("\(error)", function: function, line: line)
            return .userCancellation

        case .appcastParseError,
             .appcastError,
             .downloadError,
             .authenticationFailure,
             .runningFromDiskImageError,
             .runningTranslocated,
             .downgradeError:
            LogWarn("\(error)", function: function, line: line)
            return .error

        default:
            LogError("\(error)", function: function, line: line)
            return .error
        }
    }
}

extension UpdaterControllerImpl {
    fileprivate enum UpdateErrorType {
        case userCancellation
        case error
    }
}

extension UpdaterControllerImpl: UpdaterController {
    /// Checks for update immediately.
    func checkForUpdate(silentCheck: Bool = false) {
        if silentCheck {
            self.updaterController.updater.checkForUpdateInformation()
        } else {
            if let wnd = NSApp.windows.first(where: {
                $0.identifier?.rawValue == "SUUpdateAlert"
            }) {
                wnd.makeKeyAndOrderFront(self)
            } else {
                self.updaterController.checkForUpdates(self)
            }
        }
    }

    /// Sets autoupdate flag.
    /// - Parameter autoUpdate: autoupdate flag.
    func setAutoUpdate(autoUpdate: Bool) {
        self.updaterController.updater.automaticallyChecksForUpdates = autoUpdate
    }
}

// MARK: - SPUUpdaterDelegate

extension UpdaterControllerImpl: SPUUpdaterDelegate {
    func updater(_ updater: SPUUpdater, didFindValidUpdate item: SUAppcastItem) {
        let version: String = item.displayVersionString
        self.onFoundUpdate(version)
    }

    func updaterDidNotFindUpdate(_ updater: SPUUpdater) {
        self.onDidntFindUpdate()
    }

    func updater(
        _ updater: SPUUpdater,
        didFinishUpdateCycleFor updateCheck: SPUUpdateCheck,
        error: Error?
    ) {
        LogInfo("Updater did finish update cycle for: \(updateCheck)")

        if !self.processError(error: error).isNil {
            self.onCancelUpdate()
        }
    }

    func standardUserDriverWillHandleShowingUpdate(
        _ handleShowingUpdate: Bool,
        forUpdate update: SUAppcastItem,
        state: SPUUserUpdateState
    ) {
        self.willShowUpdate()
    }

    func updater(_ updater: SPUUpdater, mayPerform updateCheck: SPUUpdateCheck) throws {
        LogDebugTrace()

        guard !self.updaterInUpdateState else { return }
        self.appcastFeedUrl = Bundle.main.infoDictionary?[Constants.updaterFeedKey] as? String

        guard let appcastFeed = self.appcastFeedUrl,
              let url = URL(string: appcastFeed)
        else { return }

        let sem = DispatchSemaphore(value: 0)

        LogInfo("Checking appcast url \(url)")
        self.updaterInUpdateState = true

        Task {
            var hasError = false
            do {
                let response = try await NetworkManagerImpl().data(
                    request:
                        Request(
                            url: url,
                            useProtocolCachePolicy: false,
                            timeoutInterval: Constants.updaterFeedCheckDataTimeout
                        )
                )
                hasError = !(200...299).contains(response.code)
            } catch {
                LogInfo("Checking appcast url error: \(error)")
                hasError = true
            }
            if self.updaterInUpdateState,
               hasError {
                var components = URLComponents(string: appcastFeed)
                components?.host = BuildConfig.AG_ALTERNATE_UPDATE_DOMAIN
                self.appcastFeedUrl = components?.string ?? self.appcastFeedUrl
            }
            sem.signal()
        }
        _ = sem.wait(timeout: .now() + Constants.updaterFeedCheckWaitTimeout)
        self.updaterInUpdateState = false
    }

    func feedURLString(for updater: SPUUpdater) -> String? {
        LogInfo("appcastFeedUrl: \(self.appcastFeedUrl ?? "nil")")
        return self.appcastFeedUrl
    }

    func allowedChannels(for updater: SPUUpdater) -> Set<String> {
        let channel = Constants.UpdateChannel(rawValue: self.userSettings.currentUpdateChannel)
        let allowedChannels = channel.allowedChannels
        LogDebug("Allowed update channels: \(allowedChannels)")
        return allowedChannels
    }
}

// MARK: - SPUStandardUserDriverDelegate

extension UpdaterControllerImpl: SPUStandardUserDriverDelegate {
    var supportsGentleScheduledUpdateReminders: Bool { true }
}

extension SPUUpdateCheck: @retroactive CustomStringConvertible {
    public var description: String {
        switch self {
        /// The user-initiated update check corresponding to `-[SPUUpdater checkForUpdates]`.
        case .updates:
            "userInitiatedUpdates"
        /// The background scheduled update check corresponding to `-[SPUUpdater checkForUpdatesInBackground]`.
        case .updatesInBackground:
            "updatesInBackground"
        /// The informational probe update check corresponding to `-[SPUUpdater checkForUpdateInformation]`.
        case .updateInformation:
            "updateInformation"
        @unknown default:
            "Unknown default"
        }
    }
}

#else

final class UpdaterControllerImpl: UpdaterController {
    init(
        onFoundUpdate: @escaping (String) -> Void = { _ in },
        onDidntFindUpdate: @escaping () -> Void = {},
        onCancelUpdate: @escaping () -> Void = {},
        willShowUpdate: @escaping () -> Void = {}
    ) {}

    func checkForUpdate(silentCheck: Bool) {}
    func setAutoUpdate(autoUpdate: Bool) {}
}

#endif
