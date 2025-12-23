// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ContentBlockerServiceLocator.swift
//  BlockerExtension
//

import Foundation

// MARK: - ServiceDependent.setupServices

extension ServiceDependent {
    func setupServices() {
        ContentBlockerServiceLocator.shared.injectDependencies(in: self)
    }
}

// MARK: - ServiceLocator

extension ContentBlockerServiceLocator {
    func injectDependencies(in client: ServiceDependent) {
        (client as? FiltersStorageDependent)?.filtersStorage = self.filtersStorage
        (client as? SharedSettingsStorageDependent)?.sharedSettingsStorage = self.sharedSettingsStorage
    }
}

// MARK: - ContentBlockerServiceLocator

private final class ContentBlockerServiceLocator {
    // MARK: Private properties

    private let fileManager: AMFileManager

    // MARK: Injectable properties

    private let fileService: GroupFolderFileService
    private let filtersStorage: FiltersStorage
    private let sharedSettingsStorage: SharedSettingsStorage

    // MARK: Singleton

    static let shared = ContentBlockerServiceLocator()

    // MARK: Init

    private init() {
        self.fileManager = AMFileManagerImpl()
        self.fileService = GroupFolderFileServiceImpl(fileManager: self.fileManager)
        self.filtersStorage = FiltersStorageImpl(fileStorage: self.fileService)

        self.sharedSettingsStorage = SharedSettingsStorageImpl()
    }
}
