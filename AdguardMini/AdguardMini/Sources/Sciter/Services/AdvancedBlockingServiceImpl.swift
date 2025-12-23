// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AdvancedBlockingServiceImpl.swift
//  AdguardMini
//

import Foundation
import SciterSchema
import AML

extension Sciter.AdvancedBlockingServiceImpl: UserSettingsServiceDependent {}

extension Sciter {
    final class AdvancedBlockingServiceImpl: AdvancedBlockingService.ServiceType {
        var userSettingsService: UserSettingsService!

        override init() {
            super.init()
            self.setupServices()
        }

        func getAdvancedBlocking(_ message: SciterSchema.EmptyValue,
                                 _ promise: @escaping (SciterSchema.AdvancedBlocking) -> Void) {
            promise(self.userSettingsService.advancedBlockingState.toProto())
        }

        func updateAdvancedBlocking(_ message: SciterSchema.AdvancedBlocking,
                                    _ promise: @escaping (SciterSchema.EmptyValue) -> Void) {
            self.userSettingsService.advancedBlockingState = message.toDTO()
            promise(EmptyValue())
        }
    }
}
