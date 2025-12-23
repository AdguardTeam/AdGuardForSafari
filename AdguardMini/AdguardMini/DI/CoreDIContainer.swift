// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  CoreDIContainer.swift
//  AdguardMini
//

import Foundation
import ContentBlockerConverter

// MARK: - CoreDIContainer

protocol CoreDIContainer {
    var loginItemManager: LoginItemManager { get }
    var fileManager: AMFileManager { get }
    var contentBlockerConverter: ContentBlockerConverter { get }
    var systemInfoManager: SystemInfoManager { get }
    var networkManager: NetworkManager { get }
    var watchdogManager: WatchdogManager { get }
    var keychain: KeychainManager { get }
}

// MARK: - CoreDIContainerImpl

struct CoreDIContainerImpl: CoreDIContainer {
    let loginItemManager: LoginItemManager
    let fileManager: AMFileManager
    let contentBlockerConverter: ContentBlockerConverter
    let systemInfoManager: SystemInfoManager
    let networkManager: NetworkManager
    let watchdogManager: WatchdogManager
    let keychain: KeychainManager

    init(
        loginItemManager: LoginItemManager = LoginItemManagerImpl(),
        fileManager: AMFileManager = AMFileManagerImpl(),
        contentBlockerConverter: ContentBlockerConverter = ContentBlockerConverter(),
        systemInfoManager: SystemInfoManager = SystemInfoManagerImpl(),
        networkManager: NetworkManager = NetworkManagerImpl(),
        watchdogManager: WatchdogManager = WatchdogManagerImpl(),
        keychain: KeychainManager = KeychainManagerImpl()
    ) {
        self.loginItemManager = loginItemManager
        self.fileManager = fileManager
        self.contentBlockerConverter = contentBlockerConverter
        self.systemInfoManager = systemInfoManager
        self.networkManager = networkManager
        self.watchdogManager = watchdogManager
        self.keychain = keychain
    }
}
