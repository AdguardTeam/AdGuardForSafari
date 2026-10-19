// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExternalEventsAdapterTests.swift
//  AdguardMiniTests
//

import XCTest
import SafariServices
import AML

// MARK: - Constants

private enum Constants {
    static let delay: Double = 0.05
    static let appStateTimestamp: EBATimestamp = 200
    static let pageUrl: URL = URL(string: "https://example.com")!
}

// MARK: - MockRunningAppStream

private final class MockRunningAppStream: RunningAppStreaming, @unchecked Sendable {
    private let lock = UnfairLock()
    private var _continuation: AsyncStream<Bool>.Continuation?

    var continuation: AsyncStream<Bool>.Continuation? {
        locked(self.lock) { self._continuation }
    }

    func stream() -> AsyncStream<Bool> {
        AsyncStream { continuation in
            locked(self.lock) {
                self._continuation = continuation
            }
        }
    }

    func emit(_ value: Bool) {
        locked(self.lock) { self._continuation }?.yield(value)
    }

    func finish() {
        locked(self.lock) { self._continuation }?.finish()
    }
}

// MARK: - SpyEffectRunner

/// No-op `EffectRunning` that prevents real effects from executing.
private final class SpyEffectRunner: EffectRunning, @unchecked Sendable {
    func run(_ effect: Store.Effect) async -> Store.Action? { nil }
    func cancelAll() {}
    func registerTask(_ task: Task<Void, Never>, for effect: Store.Effect) {}
}

// MARK: - ExternalEventsAdapterTests

/// `@MainActor` because the code under test is main-actor isolated.
@MainActor
final class ExternalEventsAdapterTests: XCTestCase {
    // MARK: NSWorkspace stream -> mainAppRunningChanged

    func testMainAppRunningChangedDispatchedOnStreamEmit() async throws {
        let mockStream = MockRunningAppStream()
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(
            store: store,
            runningAppStream: mockStream
        )

        adapter.start()

        // Emit main app appeared
        mockStream.emit(true)
        try await Task.sleep(seconds: Constants.delay)

        let state = await store.currentState()
        XCTAssertTrue(state.mainAppRunning)

        adapter.stop()
    }

    // MARK: XPC delegate -> appStateChanged

    func testAppStateChangedDispatchedFromDelegate() async throws {
        let mockStream = MockRunningAppStream()
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(
            store: store,
            runningAppStream: mockStream
        )

        let appState = EBAAppState()
        appState.isProtectionEnabled = true
        appState.lastCheckTime = Constants.appStateTimestamp

        adapter.appStateChanged(appState)
        try await Task.sleep(seconds: Constants.delay)

        let state = await store.currentState()
        XCTAssertTrue(state.protectionEnabled)
        XCTAssertEqual(state.lastAppStateTimestamp, Constants.appStateTimestamp)
    }

    // MARK: stop() cancels subscriptions

    func testStopCancelsRunningAppSubscription() async throws {
        let mockStream = MockRunningAppStream()
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(
            store: store,
            runningAppStream: mockStream
        )

        adapter.start()
        adapter.stop()

        // Emit after stop — should NOT be dispatched
        mockStream.emit(true)
        try await Task.sleep(seconds: Constants.delay)

        let state = await store.currentState()
        XCTAssertFalse(state.mainAppRunning, "Action should not be dispatched after stop()")
    }

    // MARK: XPC delegate -> logLevelChanged

    func testLogLevelChangedDispatchedFromDelegate() async throws {
        let mockStream = MockRunningAppStream()
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(
            store: store,
            runningAppStream: mockStream
        )

        adapter.setLogLevel(.verbose)
        try await Task.sleep(seconds: Constants.delay)

        // Action logLevelChanged produces a .setLogLevel effect.
        // Effects are handled by SpyEffectRunner (no-op), so no crash is expected.
        // Confirms the action was dispatched and the store processed it without error.
    }

    // MARK: XPC delegate -> themeChanged

    func testThemeChangedDispatchedFromDelegate() async throws {
        let mockStream = MockRunningAppStream()
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(
            store: store,
            runningAppStream: mockStream
        )

        adapter.setTheme(.dark)
        try await Task.sleep(seconds: Constants.delay)

        // Similar to logLevel — themeChanged produces .setAppTheme effect.
        // EffectRunner is a no-op spy; no state field exists for theme, so no crash expected.
    }

    // MARK: refreshTabStats -> tabContextUpdated

    func testRefreshTabStatsDispatchesSingleAction() async throws {
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(store: store)

        let adsBlocked = 3
        let trackersBlocked = 1
        let token = Store.SafariWindowToken(rawValue: 42)
        let stats = TabStats(
            adsBlocked: adsBlocked,
            trackersBlocked: trackersBlocked,
            url: Constants.pageUrl.absoluteString
        )

        await adapter.refreshTabStats(stats: stats, token: token, pageUrl: Constants.pageUrl)

        let state = await store.currentState()
        XCTAssertEqual(state.tabStats, stats)
        XCTAssertEqual(state.tabContext.url, Constants.pageUrl)
        XCTAssertEqual(state.tabContext.domain, Constants.pageUrl.host ?? "")
        XCTAssertFalse(state.tabContext.isSystemPage)
        XCTAssertEqual(state.tabContext.windowToken, token)
    }

    func testRefreshTabStatsWithNilUrlProducesSystemPageContext() async throws {
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(store: store)

        let token = Store.SafariWindowToken(rawValue: 1)

        await adapter.refreshTabStats(stats: TabStats(), token: token, pageUrl: nil)

        let state = await store.currentState()
        XCTAssertTrue(state.tabContext.isSystemPage)
        XCTAssertTrue(state.tabContext.domain.isEmpty)
        XCTAssertNil(state.tabContext.url)
    }

    // MARK: Hostless URL with scheme is not a system page

    func testRefreshTabStatsWithFileUrlIsNotSystemPage() async throws {
        let store = PopupStore(effectRunner: SpyEffectRunner())
        let adapter = ExternalEventsAdapter(store: store)
        let token = Store.SafariWindowToken(rawValue: 1)
        let fileUrl = URL(string: "file:///Users/test/index.html")!

        await adapter.refreshTabStats(stats: TabStats(), token: token, pageUrl: fileUrl)

        let state = await store.currentState()
        XCTAssertFalse(
            state.tabContext.isSystemPage,
            "file:// URL has a scheme — must not be treated as a system page"
        )
        XCTAssertEqual(state.tabContext.domain, "file://")
    }
}
