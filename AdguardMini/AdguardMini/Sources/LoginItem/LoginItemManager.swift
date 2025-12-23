// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LoginItemManager.swift
//  AdguardMini
//

import Foundation
import ServiceManagement
import Combine
import AML

// MARK: - LoginItemManager

protocol LoginItemManager {
    func checkAndRegisterHelper() -> LoginItemManagerRegisterStatus
}

// MARK: - LoginItemManagerImpl

final class LoginItemManagerImpl: LoginItemManager {
    @available(macOS 13.0, *)
    private var helperLoginItem: SMAppService {
        SMAppService.loginItem(identifier: BuildConfig.AG_HELPER_ID)
    }

    func checkAndRegisterHelper() -> LoginItemManagerRegisterStatus {
        guard #available(macOS 13.0, *) else {
            return self.legacyCheckAndRegisterHelper()
            ? LoginItemManagerRegisterStatus.enabled
            : LoginItemManagerRegisterStatus.requiresApproval
        }
        return self.modernCheckAndRegisterHelper()
    }

    // MARK: Modern section

    @available(macOS 13.0, *)
    private func modernCheckAndRegisterHelper() -> LoginItemManagerRegisterStatus {
        var status = self.helperLoginItem.status.registerStatus
        switch status {
        case .notRegistered, .notFound:
            LogInfo("Helper not registered")
            status = self.modernRegisterHelperItem()
        case .unexpected:
            LogError("Unexpected status for loginItem: \(status)")
        case .requiresApproval:
            LogDebug("Helper requires approval")
        case .enabled:
            LogDebug("Helper status: enabled")
            status = self.modernRegisterHelperItem(reregister: true)
        }
        return status
    }

    @available(macOS 13.0, *)
    private func modernRegisterHelperItem(reregister: Bool = false) -> LoginItemManagerRegisterStatus {
        do {
            do {
                try self.helperLoginItem.unregister()
            } catch {
                LogWarn("Can't unregister helper: \(error)")
            }
            try self.helperLoginItem.register()
        } catch {
            LogError("Failed to register helper: \(error)")
        }
        return self.helperLoginItem.status.registerStatus
    }

    // MARK: Legacy section

    @available(macOS, deprecated: 13.0, message: "Please use SMAppService instead")
    private func legacyCheckAndRegisterHelper() -> Bool {
        SMLoginItemSetEnabled(BuildConfig.AG_HELPER_ID as CFString, false)
        return SMLoginItemSetEnabled(BuildConfig.AG_HELPER_ID as CFString, true)
    }
}
