// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionHandler.swift
//  EntryExtension
//

import SafariServices
import AML
import AGSEDesignSystem

// MARK: - Constants

private enum Constants {
    static let adguardExtraScriptUrl = Bundle.main.url(
        forResource: "adguard-extra",
        withExtension: "js"
    )

    /// Base interval for the adaptive toolbar update throttle.
    static let toolbarThrottleBaseDelay: TimeInterval = 0.3

    /// Maximum interval the adaptive throttle can grow to under sustained pressure.
    static let toolbarThrottleMaxDelay: TimeInterval = 2.0

    static let adguardExtra: String? = {
        guard let scriptUrl = Constants.adguardExtraScriptUrl else {
            LogError("Can't find script in bundle")
            return nil
        }

        do {
            return try String(contentsOf: scriptUrl)
        } catch {
            LogError("Can't read adguardExtra script: \(error)")
            return nil
        }
    }()
}

// MARK: - OutgoingExtensionMessage

/// Outgoing messages, passed to extension script
enum OutgoingExtensionMessage: String {
    /// Pings the helper script to see if it's already injected.
    case blockElementPing
    /// Command to start the assistant script.
    case blockElement
    /// Message with AdGuardExtra script body.
    case adguardExtraData
}

// MARK: - IncomingExtensionMessage

/// Incoming messages from extension script
enum IncomingExtensionMessage: String {
    /// The script sends this message in response to a ping. It means that it is ready to work.
    case blockElementPong
    /// Message with information about which rule for the current page the user created using assistant script.
    case ruleResponse
    /// Injector sends this message to get the AdGuard Extra script.
    case getAdGuardExtraData
    /// Message inviting you to subscribe to the filter.
    case addFilterSubscription
    /// Unknown message from one of scripts.
    case unknown

    init(rawValue: String) {
        switch rawValue {
        case Self.blockElementPong.rawValue:
            self = .blockElementPong
        case Self.ruleResponse.rawValue:
            self = .ruleResponse
        case Self.getAdGuardExtraData.rawValue:
            self = .getAdGuardExtraData
        case Self.addFilterSubscription.rawValue:
            self = .addFilterSubscription
        default:
            self = .unknown
        }
    }
}

// MARK: - SafariExtensionHandler

/// Popup extension handler
///
/// `@unchecked Sendable` because the dependencies are assigned once in `init`
/// on the main thread and only read afterwards; every service is used through
/// its own isolation — main-actor types, actors, lock-guarded objects, or
/// stateless helpers.
final class SafariExtensionHandler: SFSafariExtensionHandler, @unchecked Sendable {
    // MARK: Dependencies

    /// Main-thread-confined collaborators, resolved once from the main-actor
    /// container so that `init` can assign them to `let` properties.
    private struct Dependencies: @unchecked Sendable {
        let viewController: SFSafariExtensionViewController
        let safariApi: SafariApiInteractor
        let popupStore: PopupStore
        let externalEventsAdapter: ExternalEventsAdapter
        let sharedSettingsStorage: SharedSettingsStorage
        let advancedBlockerHandler: AdvancedBlockerHandler
        let appDiscovery: MainAppDiscovery
        let statsReporter: BlockingStatsReporter
        let perTabStatsTracker: PerTabStatsTracker
        let safariApp: SafariApp

        @MainActor
        init(container: DIContainer) {
            self.viewController = container.safariController
            self.safariApi = container.safariApiInteractor
            self.popupStore = container.popupStore
            self.externalEventsAdapter = container.externalEventsAdapter
            self.sharedSettingsStorage = container.sharedSettingsStorage
            self.advancedBlockerHandler = container.advancedBlockerHandler
            self.appDiscovery = container.mainAppDiscovery
            self.statsReporter = container.blockingStatsReporter
            self.perTabStatsTracker = container.perTabStatsTracker
            self.safariApp = container.safariApp
        }
    }

    private let viewController: SFSafariExtensionViewController
    private let safariApi: SafariApiInteractor
    private let popupStore: PopupStore
    private let externalEventsAdapter: ExternalEventsAdapter
    private let sharedSettingsStorage: SharedSettingsStorage
    private let advancedBlockerHandler: AdvancedBlockerHandler
    private let appDiscovery: MainAppDiscovery
    private let statsReporter: BlockingStatsReporter
    private let perTabStatsTracker: PerTabStatsTracker
    private let safariApp: SafariApp

    /// Rate-limits toolbar updates (leading + trailing edge, adaptive backoff)
    /// so heavy-tracker pages do not trigger a full toolbar-validation cycle on
    /// every blocked resource. See `Throttler`.
    ///
    /// Used only by `contentBlocker(...)` — navigation callbacks (`willNavigateTo`)
    /// fire at most a few times per redirect chain, so throttling there would
    /// add complexity without measurable benefit.
    private let toolbarThrottler: Throttler

    // MARK: Init

    // Safari instantiates the principal class on the main thread; the container is main-actor isolated.
    override init() {
        let dependencies = MainActor.assumeIsolated {
            Dependencies(container: DIContainer.shared)
        }

        self.viewController = dependencies.viewController
        self.safariApi = dependencies.safariApi
        self.popupStore = dependencies.popupStore
        self.externalEventsAdapter = dependencies.externalEventsAdapter
        self.sharedSettingsStorage = dependencies.sharedSettingsStorage
        self.advancedBlockerHandler = dependencies.advancedBlockerHandler
        self.appDiscovery = dependencies.appDiscovery
        self.statsReporter = dependencies.statsReporter
        self.perTabStatsTracker = dependencies.perTabStatsTracker
        self.safariApp = dependencies.safariApp

        let safariApp: SafariApp = dependencies.safariApp
        self.toolbarThrottler = Throttler(
            baseDelay: Constants.toolbarThrottleBaseDelay,
            maxDelay: Constants.toolbarThrottleMaxDelay,
            // `setToolbarItemsNeedUpdate()` is UI-affecting, so hop to the main actor.
            // Throttler itself fires on its own actor executor, which may be off-main.
            // Labeled parameter makes the role of the closure explicit.
            // swiftlint:disable:next trailing_closure
            fire: { Task { @MainActor in safariApp.setToolbarItemsNeedUpdate() } }
        )

        super.init()
    }

    deinit {
        // Best-effort teardown: actor `cancel()` is async and `deinit` is synchronous.
        // Cancellation is bridged through a `Task`.
        // Pending trailing updates are intentionally dropped — the badge refreshes on the next wake-up.
        let throttler: Throttler = self.toolbarThrottler
        Task { await throttler.cancel() }
        LogDebug("\(self) deinited")
    }

    // MARK: Overrides

    override func contentBlocker(
        withIdentifier contentBlockerIdentifier: String,
        blockedResourcesWith urls: [URL],
        on page: SFSafariPage
    ) {
        guard !urls.isEmpty else { return }

        guard let blockerType = SafariBlockerType(contentBlockerIdentifier: contentBlockerIdentifier) else {
            LogWarn("Unknown content blocker identifier: \(contentBlockerIdentifier)")
            return
        }

        LogDebug("Content blocker \(blockerType) blocked \(urls.count) resource(s)")

        let pageHash = page.hashValue
        // The page is handed to the tracker actor and not used afterwards.
        nonisolated(unsafe) let trackedPage = page
        Task {
            await self.perTabStatsTracker.trackBlocked(
                pageHash: pageHash,
                urls: urls,
                blockerType: blockerType,
                page: trackedPage
            )
            await self.perTabStatsTracker.evictStaleEntries()
        }

        self.statsReporter.enqueueBlocking(pageHash: pageHash, urls: urls, blockerType: blockerType)

        // Throttle toolbar updates.
        // Each burst collapses into a leading fire plus one trailing fire per window.
        Task { await self.toolbarThrottler.schedule() }
    }

    override func page(_ page: SFSafariPage, willNavigateTo url: URL?) {
        let pageHash = page.hashValue
        // Task ensures ordering: stats reset completes before toolbar refresh.
        Task {
            await self.perTabStatsTracker.resetStats(pageHash: pageHash, to: url)
            // Direct update: willNavigateTo fires rarely (1-3 times per redirect chain).
            await MainActor.run {
                self.safariApp.setToolbarItemsNeedUpdate()
            }
        }
    }

    // This is required by the signature of the function we're overwriting
    // swiftlint:disable:next discouraged_optional_collection
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String: Any]?) {
        // `[String: Any]` is not Sendable; the log line captures a String snapshot.
        let userInfoDescription = "\(userInfo ?? [:])"
        page.getPropertiesWithCompletionHandler { [messageName, userInfoDescription] properties in
            LogDebug("The extension received a message \"\(messageName)\" from a script injected into (\(properties?.url?.absoluteString ?? "nil")) with userInfo (\(userInfoDescription))")
        }

        let message = IncomingExtensionMessage(rawValue: messageName)

        switch message {
        case .blockElementPong:
            page.dispatchMessageToScript(withName: OutgoingExtensionMessage.blockElement.rawValue)
        case .ruleResponse:
            LogInfo("Try to add rule to user rules: \(userInfo?["rule"] ?? "nil")")
            // `[String: Any]` is not Sendable; the copy is only read.
            nonisolated(unsafe) let ruleInfo = userInfo
            Task {
                if let newRule = ruleInfo?["rule"] as? String {
                    do {
                        try await self.safariApi.addRule(newRule)
                    } catch {
                        LogError("Can't add rule \"\(newRule)\". Error: \(error)")
                    }
                }
            }
        case .getAdGuardExtraData:
            // `[String: Any]` and the page are not Sendable; the copies are only read.
            nonisolated(unsafe) let extraInfo = userInfo ?? [:]
            nonisolated(unsafe) let extraPage = page
            Task { await self.processAdGuardExtra(for: extraPage, userInfo: extraInfo) }
        case .addFilterSubscription:
            // `[String: Any]` is not Sendable; the copy is only read.
            nonisolated(unsafe) let subscribeInfo = userInfo
            Task {
                if let subscribeUrlString = subscribeInfo?["url"] as? String {
                    do {
                        try await self.appDiscovery.subscribeCustomFilter(subscribeUrlString)
                    } catch {
                        LogError("Can't start subscribe to custom filter. Error: \(error)")
                    }
                } else {
                    LogWarn("Can't add filter subscription. Missing url")
                }
            }
        default:
            LogDebug("Received unknown message \(messageName). Try send to AdvancedBlocking")
            self.advancedBlockerHandler.messageReceived(withName: messageName, from: page, userInfo: userInfo ?? [:])
        }
    }

    override func validateToolbarItem(
        in window: SFSafariWindow,
        validationHandler: @escaping ((Bool, String) -> Void)
    ) {
        // The window and the completion closure are handed to the task once.
        nonisolated(unsafe) let validationWindow = window
        nonisolated(unsafe) let validation = validationHandler
        Task { @MainActor in
            guard let toolbarItem = await validationWindow.toolbarItem() else {
                validation(false, "")
                return
            }

            let tabStats = await self.perTabStatsTracker
                .getStatsForActiveTab(in: validationWindow)

            let state = self.popupStore.snapshot()
            let badgeText = ToolbarRenderer.render(
                state: state,
                tabStats: tabStats,
                showBadge: self.sharedSettingsStorage
                    .showSafariToolbarBadge,
                into: toolbarItem
            )
            validation(true, badgeText)

            let token = Store.SafariWindowToken(
                rawValue: UInt(bitPattern: ObjectIdentifier(validationWindow))
            )

            // Only update tab context and dispatch XPC prereqs for the active window.
            // Background-window updates would overwrite the popup domain.
            // This causes flicker when the counter fires in another window.
            let activeWindow = await SFSafariApplication.activeWindow()
            guard activeWindow == validationWindow else { return }

            let pageUrl = await validationWindow.activeTab()?.activePage()?.properties()?.url
            await self.externalEventsAdapter.refreshTabStats(
                stats: tabStats,
                token: token,
                pageUrl: pageUrl
            )

            await self.popupStore.dispatch(
                .toolbarValidationRequested(window: token)
            )
        }
    }

    override func popoverViewController() -> SFSafariExtensionViewController {
        self.viewController
    }

    private func processAdGuardExtra(for page: SFSafariPage, userInfo: [String: Any]) async {
        guard let url = await page.properties()?.url?.absoluteString else {
            LogError("Invalid page for AdGuard Extra")
            return
        }

        do {
            let isActive = try await self.safariApi.getExtraState(withUrl: url)
            guard isActive else {
                LogDebug("AdGuard extra is inactive")
                return
            }

            guard let script = Constants.adguardExtra else {
                LogError("Can't find or read script in bundle")
                return
            }

            page.dispatchMessageToScript(
                withName: OutgoingExtensionMessage.adguardExtraData.rawValue,
                userInfo: [
                    "script": script,
                    "verbose": Logger.shared.logLevel == .debug,
                    "requestId": userInfo["requestId"] ?? ""
                ]
            )
        } catch {
            LogError("Error getExtraState: \(error)")
            return
        }
    }
}
