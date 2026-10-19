// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ThrottlerTests.swift
//  AdguardMiniTests
//

import XCTest
import AML

// MARK: - FireCounter

/// Thread-safe counter recording how many times the throttled side effect fired.
private final class FireCounter: @unchecked Sendable {
    private let lock = UnfairLock()
    private var value = 0

    var count: Int {
        locked(self.lock) { self.value }
    }

    func increment() {
        locked(self.lock) { self.value += 1 }
    }
}

// MARK: - ManualClock

/// Deterministic sleep for tests. Records every requested delay and suspends
/// until the test explicitly releases the pending sleep, so the throttler's
/// state machine can be driven step by step without wall-clock timing.
///
/// The throttler keeps a single in-flight window task, so at most one sleep is
/// pending at a time — this clock relies on that invariant.
private final class ManualClock: @unchecked Sendable {
    private let lock = UnfairLock()
    private var recorded: [TimeInterval] = []
    private var pendingResume: CheckedContinuation<Void, Error>?
    private var sleepRegistered: CheckedContinuation<Void, Never>?

    /// Every delay the throttler has asked to sleep for, in order.
    var recordedDelays: [TimeInterval] {
        locked(self.lock) { self.recorded }
    }

    /// Injected as the throttler's `sleep`. Suspends until `releaseSleep()` or
    /// task cancellation.
    func sleep(_ delay: TimeInterval) async throws {
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
                let waiter: CheckedContinuation<Void, Never>? = locked(self.lock) {
                    self.recorded.append(delay)
                    self.pendingResume = cont
                    let registered = self.sleepRegistered
                    self.sleepRegistered = nil
                    return registered
                }
                waiter?.resume()
            }
        } onCancel: {
            let cont: CheckedContinuation<Void, Error>? = locked(self.lock) {
                let pending = self.pendingResume
                self.pendingResume = nil
                return pending
            }
            cont?.resume(throwing: CancellationError())
        }
    }

    /// Suspends until the throttler has registered its next sleep.
    func waitForNextSleep() async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let ready: Bool = locked(self.lock) {
                if self.pendingResume != nil { return true }
                self.sleepRegistered = cont
                return false
            }
            if ready { cont.resume() }
        }
    }

    /// Completes the currently pending sleep, letting the window elapse.
    func releaseSleep() {
        let cont: CheckedContinuation<Void, Error>? = locked(self.lock) {
            let pending = self.pendingResume
            self.pendingResume = nil
            return pending
        }
        cont?.resume()
    }
}

// MARK: - Test fixtures

private enum Fixtures {
    static let baseDelay: TimeInterval = 0.3
    static let maxDelay: TimeInterval = 2.0

    static func makeThrottler(
        counter: FireCounter,
        clock: ManualClock
    ) -> Throttler {
        Throttler(
            baseDelay: Self.baseDelay,
            maxDelay: Self.maxDelay,
            sleep: { try await clock.sleep($0) },
            fire: { counter.increment() }
        )
    }
}

// MARK: - Tests

/// `@MainActor` because the code under test is main-actor isolated.
@MainActor
final class ThrottlerTests: XCTestCase {
    /// Spins until the throttler has returned to its idle state. Deterministic:
    /// the burst loop flips `isWindowOpen` to `false` only after it has reset
    /// the delay and dropped its window task, so observing idle proves the
    /// close-out finished — no reliance on scheduler timing.
    private func waitUntilIdle(_ throttler: Throttler) async {
        while await throttler.isThrottling {
            await Task.yield()
        }
    }

    func testLeadingEdgeFiresImmediately() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()

        XCTAssertEqual(counter.count, 1)
        let open = await throttler.isThrottling
        XCTAssertTrue(open)
    }

    func testEventsDuringWindowDoNotFireAgain() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()
        await clock.waitForNextSleep()
        await throttler.schedule()
        await throttler.schedule()

        XCTAssertEqual(counter.count, 1)
    }

    func testWindowClosesToIdleWhenNoPendingEvents() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()
        await clock.waitForNextSleep()
        clock.releaseSleep()

        // Wait deterministically for the burst loop to close the window.
        // Termination of this barrier proves the throttler reached idle.
        await self.waitUntilIdle(throttler)
        let open = await throttler.isThrottling
        XCTAssertFalse(open)
        XCTAssertEqual(counter.count, 1)
    }

    func testTrailingEdgeFiresOnceWhenEventsArriveDuringWindow() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()      // Leading fire (count 1), window opens.
        await clock.waitForNextSleep()
        await throttler.schedule()      // Coalesced — marks pending.
        await throttler.schedule()      // Coalesced — still one pending.
        clock.releaseSleep()            // Window elapses → one trailing fire.

        // The burst loop opens a new window after the trailing fire and sleeps again.
        // `waitForNextSleep()` is a reliable barrier here.
        // It suspends until the burst loop registers the new sleep.
        // By then the trailing fire and the delay ramp-up have already happened.
        await clock.waitForNextSleep()

        let open = await throttler.isThrottling
        XCTAssertTrue(open)     // New window is open after trailing fire.
        XCTAssertEqual(counter.count, 2)
    }

    func testDelayDoublesUnderSustainedPressureCappedAtMax() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()              // Leading: opens window of baseDelay.

        // Five consecutive pressured windows: keep an event pending each time.
        for _ in 0..<5 {
            await clock.waitForNextSleep()
            await throttler.schedule()          // Mark pending → forces trailing.
            clock.releaseSleep()                // Trailing fire + ramp up.
        }
        await clock.waitForNextSleep()          // Sync to the sixth window's sleep.

        XCTAssertEqual(clock.recordedDelays, [0.3, 0.6, 1.2, 2.0, 2.0, 2.0])
        XCTAssertEqual(counter.count, 6)        // 1 leading + 5 trailing.
    }

    func testDelayResetsToBaseAfterBurstEnds() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        // First burst: ramp the delay up by one step.
        await throttler.schedule()          // Leading; window 1 sleeps 0.3.
        await clock.waitForNextSleep()
        await throttler.schedule()          // Pending.
        clock.releaseSleep()                // Trailing; delay ramps to 0.6.
        await clock.waitForNextSleep()      // Window 2 sleeps 0.6.

        // End the burst: no events this window.
        clock.releaseSleep()                // Window 2 closes → must reset delay.

        // Wait deterministically until the burst loop reaches idle.
        // `currentDelay` is therefore reset before the next burst starts.
        await self.waitUntilIdle(throttler)

        // Second burst should start at baseDelay again.
        await throttler.schedule()          // New leading; window sleeps base.
        await clock.waitForNextSleep()

        XCTAssertEqual(clock.recordedDelays, [0.3, 0.6, 0.3])
    }

    func testCancelDropsPendingUpdateAndUnlatches() async {
        let counter = FireCounter()
        let clock = ManualClock()
        let throttler = Fixtures.makeThrottler(counter: counter, clock: clock)

        await throttler.schedule()          // Leading fire (count 1), window opens.
        await clock.waitForNextSleep()
        await throttler.schedule()          // Pending trailing queued.
        await throttler.cancel()            // Cancel mid-window: drop pending.

        let openAfterCancel = await throttler.isThrottling
        XCTAssertFalse(openAfterCancel)     // Returned to idle.
        XCTAssertEqual(counter.count, 1)    // Trailing was dropped, not fired.

        // No latch: a subsequent event still produces a leading fire.
        await throttler.schedule()
        XCTAssertEqual(counter.count, 2)
        let openAfterReschedule = await throttler.isThrottling
        XCTAssertTrue(openAfterReschedule)
    }
}
