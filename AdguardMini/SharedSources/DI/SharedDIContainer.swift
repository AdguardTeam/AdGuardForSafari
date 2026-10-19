// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SharedDIContainer.swift
//  AdguardMini
//

// MARK: - DIContainer

/// A class containing some important shared dependencies.
final class SharedDIContainer {
    // MARK: Singleton

    /// `nonisolated(unsafe)` because the container is created once and only
    /// read afterwards. The class stays non-Sendable, so the compiler still
    /// rejects passing an instance between isolation domains.
    nonisolated(unsafe) static let shared: SharedDIContainer = SharedDIContainer()

    // MARK: Public properties

    let sharedSettingsStorage: SharedSettingsStorage = SharedSettingsStorageImpl()

    let filtersStorage: FiltersStorage = {
        let fileManager = AMFileManagerImpl()
        let fileStorage = GroupFolderFileServiceImpl(fileManager: fileManager)
        return FiltersStorageImpl(fileStorage: fileStorage)
    }()

    // MARK: Init

    private init() {}
}
