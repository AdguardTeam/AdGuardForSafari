// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariPopupApiClient.swift
//  AdguardMini
//

import AML

final class SafariPopupApiClient: SafariPopupApi {
    private let proxyStorage: XPCConnectionStorage

    init(proxyStorage: XPCConnectionStorage) {
        self.proxyStorage = proxyStorage
    }

    func appStateChanged(_ appState: EBAAppState) {
        self.withProxies { proxy in
            proxy.appStateChanged(appState)
        }
    }

    func setLogLevel(_ logLevel: LogLevel) {
        self.withProxies { proxy in
            proxy.setLogLevel(logLevel)
        }
    }

    func withProxies(_ completion: @escaping (SafariPopupApi) -> Void) {
        self.proxyStorage.withRemoteProxies(SafariPopupApi.self) { proxy in
            completion(proxy)
        }
    }
}
