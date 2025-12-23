// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  TrayServiceImpl.swift
//  AdguardMini
//

import Foundation
import SciterSchema
import AML
import AppKit

extension Sciter.TrayServiceImpl: EventBusDependent {}

extension Sciter {
    final class TrayServiceImpl: TrayService.ServiceType {
        var eventBus: EventBus!

        override init() {
            super.init()
            self.setupServices()
        }

        func getEffectiveTheme(_ message: EmptyValue, _ promise: @escaping (EffectiveThemeValue) -> Void) {
            promise(.current)
        }
    }
}
