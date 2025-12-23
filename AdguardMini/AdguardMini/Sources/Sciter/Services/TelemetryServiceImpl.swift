// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  TelemetryServiceImpl.swift
//  AdguardMini
//

import Foundation
import SciterSchema
import AML

extension Sciter.TelemetryServiceImpl:
    TelemetryServiceDependent {}

extension Sciter {
    final class TelemetryServiceImpl: TelemetryService.ServiceType {
        var telemetryService: Telemetry.Service!

        override init() {
            super.init()
            self.setupServices()
        }

        func recordEvent(_ message: TelemetryEvent, _ promise: @escaping (EmptyValue) -> Void) {
            Task {
                guard let messageEvent = message.kind else {
                    promise(EmptyValue())
                    assertionFailure("Invalid telemetry event: \(message)")
                    LogWarn("Invalid telemetry event")
                    return
                }

                let event: Telemetry.Event = switch messageEvent {
                case .customEvent(let event):
                    Telemetry.Event.customEvent(
                        .init(
                            name: event.name,
                            refName: event.refName,
                            action: event.hasActionName ? event.actionName : nil,
                            label: event.hasLabelName ? event.labelName : nil
                        )
                    )
                case .pageView(let event):
                    Telemetry.Event.pageview(
                        .init(
                            name: event.name,
                            refName: event.hasRefName ? event.refName : nil
                        )
                    )
                }
                await self.telemetryService.sendEvent(event)
                promise(EmptyValue())
            }
        }
    }
}
