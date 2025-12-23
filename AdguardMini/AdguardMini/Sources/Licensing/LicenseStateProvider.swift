// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LicenseStateProvider.swift
//  AdguardMini
//

import Foundation
import AML

// MARK: - LicenseStateProvider

protocol LicenseStateProvider: AnyObject {
    /// Returns stored app status info from secure storage.
    func getStoredInfo() async -> AppStatusInfo?

    /// Returns whether license reset is allowed for the provided license or for the current stored state.
    func canReset(for license: AppStatusInfo?) async -> Bool
}

// MARK: - LicenseStateProviderImpl

class LicenseStateProviderBase: LicenseStateProvider {
    private let keychain: KeychainManager

    init(keychain: KeychainManager) {
        self.keychain = keychain
    }

    func getStoredInfo() async -> AppStatusInfo? {
        await self.keychain.getAppStatusInfo()
    }

    func canReset(for license: AppStatusInfo?) async -> Bool {
        true
    }
}

#if MAS

final class LicenseStateProviderImpl: LicenseStateProviderBase {
    // MARK: Private properties

    private let appStoreInteractor: AppStoreInteractor

    // MARK: Init

    init(keychain: KeychainManager, appStoreInteractor: AppStoreInteractor) {
        self.appStoreInteractor = appStoreInteractor

        super.init(keychain: keychain)
    }

    // MARK: Public methods

    override func canReset(for appStatusInfo: AppStatusInfo?) async -> Bool {
        var info: AppStatusInfo?
        if let appStatusInfo {
            LogDebug("Use provided info")
            info = appStatusInfo
        } else {
            LogDebug("Use stored info")
            info = await self.getStoredInfo()
        }
        guard let info else {
            LogDebug("Info is nil. Can reset license")
            return true
        }

        // Non-App Store subscriptions can always be reset
        guard info.isAppStoreSubscription else {
            LogDebug("Non-AppStore subscription. Can reset license")
            return true
        }

        let hasActiveEntitlement = await self.appStoreInteractor.hasActiveEntitlement()
        let canReset = !hasActiveEntitlement
        LogDebug("Has active entitlement: \(hasActiveEntitlement). Can reset license: \(canReset)")
        return canReset
    }
}
#else

final class LicenseStateProviderImpl: LicenseStateProviderBase {}

#endif
