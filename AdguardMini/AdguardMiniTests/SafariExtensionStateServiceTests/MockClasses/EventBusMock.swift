// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EventBusMock.swift
//  AdguardMiniTests
//

// Disable for test purposes
// swiftlint:disable unavailable_function

import Foundation

final class EventBusMock: EventBus {
    var isStarted: Bool = true
    func subscribe(observer: Any, selector: Selector, event: Event) { fatalError("Usage is not expected") }
    func notifications(for event: Event) -> NotificationCenter.Notifications { fatalError("Usage is not expected") }
    func unsubscribe(observer: Any, event: Event) { fatalError("Usage is not expected") }
    func unsubscribeAll(observer: Any) { fatalError("Usage is not expected") }
    func parseNotification<T>(_ notification: Notification) -> T? { fatalError("Usage is not expected") }

    private var prepareWaitingCompletion: () -> Void = {}
    private var waitCompletion: (CurrentExtensionState) -> Void = { _ in }
    var lastUpdate: CurrentExtensionState!

    func prepareWaiting(_ completion: @escaping () -> Void) {
        self.prepareWaitingCompletion = completion
    }

    func waitUpdate(_ completion: @escaping (CurrentExtensionState) -> Void) {
        self.waitCompletion = completion
        self.prepareWaitingCompletion()
    }

    func post(event: Event, userInfo: Any?) {
        if let info = userInfo as? [SafariExtensionActivity.DictKey: Any],
           let update = info[.state] as? CurrentExtensionState {
            self.lastUpdate = update
            self.waitCompletion(update)
        } else {
            fatalError("Unexpected event")
        }
    }
}

// swiftlint:enable unavailable_function
