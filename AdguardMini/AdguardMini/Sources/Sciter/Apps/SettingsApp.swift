// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SettingsApp.swift
//  AdguardMini
//

import Foundation
import AML
import SciterSchema

final class SettingsApp: SciterApp,
                         InternalServiceDependent,
                         SettingsServiceDependent,
                         AccountServiceDependent,
                         AdvancedBlockingServiceDependent,
                         AppInfoServiceDependent,
                         FiltersServiceDependent,
                         UserRulesServiceDependent,
                         SettingsCallbackServiceDependent,
                         AccountCallbackServiceDependent,
                         FiltersCallbackServiceDependent,
                         TelemetrySciterServiceDependent,
                         UserRulesCallbackServiceDependent {
    override init(windowRect: CGRect, archivePath: String, hideOnLoosingFocus: Bool) {
        super.init(windowRect: windowRect, archivePath: archivePath, hideOnLoosingFocus: hideOnLoosingFocus)
        LogInfo("Initialized - rect: \(windowRect)")
    }

    func windowDidBecomeMain(_ notification: Notification) {
        self.app.callback(SettingsCallbackService.self).onWindowDidBecomeMain(EmptyValue())
        LogDebug("Window became main")
    }
}
