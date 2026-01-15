// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  TelemetryEvents.swift
//  AdguardMini
//

enum Telemetry {
    enum Screen: String {
        case main = "safari_popup_main"
        case protectionDisabled = "safari_popup_protection_disabled"
        case extensionsOff = "safari_popup_extensions_off"
        case failedEnableProtection = "safari_popup_failed_enable_protection"
    }

    enum Action: String {
        case pauseProtectionPopupClick = "pause_protection_popup_click"
        case settingPopupClick         = "setting_popup_click"
        case protectionPopupClick      = "protection_popup_click"
        case blockElementPopupClick    = "block_element_popup_click"
        case reportIssueClick          = "report_issue_click"
        case rateMiniPopupClick        = "rate_mini_popup_click"
        case fixItPopupClick           = "fix_it_popup_click"
    }

    enum Event {
        case pageView(_ screen: Screen)
        case action(_ action: Action, screen: Screen)
    }
}
