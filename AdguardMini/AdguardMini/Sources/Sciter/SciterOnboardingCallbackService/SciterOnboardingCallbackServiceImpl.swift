// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterOnboardingCallbackServiceImpl.swift
//  AdguardMini
//

import Foundation

import SciterSchema
import FLM
import AML

// MARK: - SciterOnboardingCallbackServiceImpl

final class SciterOnboardingCallbackServiceImpl: RestartableServiceBase, SciterOnboardingCallbackService {
    private let onboardingCallbacksGetter: () -> OnboardingCallbackService
    private var onboardingCallbacks: OnboardingCallbackService {
        self.onboardingCallbacksGetter()
    }

    private let eventBus: EventBus

    init(
        onboardingCallbacksGetter: @autoclosure @escaping () -> OnboardingCallbackService,
        eventBus: EventBus
    ) {
        self.onboardingCallbacksGetter = onboardingCallbacksGetter
        self.eventBus = eventBus

        super.init()

        self.subscribe(
            selector: #selector(self.onEffectiveThemeChanged(notification:)),
            event: .effectiveThemeChanged
        )

        LogDebug("Initialized")
    }

    @objc func onEffectiveThemeChanged(notification: Notification) {
        if let incomingTheme: Theme = self.eventBus.parseNotification(notification) {
            self.runAsyncIfStarted { [weak self] in
                let theme = EffectiveThemeValue.resolve(incomingTheme)
                self?.onboardingCallbacks.onEffectiveThemeChanged(theme)
            }
        }
    }

    private func runAsyncIfStarted(_ completion: @escaping () -> Void) {
        if !self.isStarted {
            LogDebug("Service not started, ignoring")
            return
        }
        Task {
            completion()
        }
    }

    private func subscribe(selector: Selector, event: Event) {
        self.eventBus.subscribe(
            observer: self,
            selector: selector,
            event: event
        )
    }
}
