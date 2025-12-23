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

    static let shared: SharedDIContainer = SharedDIContainer()

    // MARK: Public properties

    private(set) lazy var sharedSettingsStorage: SharedSettingsStorage = SharedSettingsStorageImpl()
    private(set) lazy var filtersStorage: FiltersStorage = {
        let fileManager = AMFileManagerImpl()
        let fileStorage = GroupFolderFileServiceImpl(fileManager: fileManager)
        return FiltersStorageImpl(fileStorage: fileStorage)
    }()

    // MARK: Init

    private init() {}
}
