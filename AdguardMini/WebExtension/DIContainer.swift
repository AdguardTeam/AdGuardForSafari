// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  DIContainer.swift
//  AdguardMini
//

/// A class containing all the objects needed for the popup
///
/// - Note: Should be inited as soon as possible: it also configures the logger
final class DIContainer {
    // MARK: Singleton

    static let shared: DIContainer = DIContainer()

    // MARK: Public properties

    private(set) lazy var safariApiInteractor: SafariApiInteractor = SafariApiInteractorImpl(
        safariApi: self.safariApi
    )

    private(set) lazy var sharedSettingsStorage: SharedSettingsStorage = SharedSettingsStorageImpl()

    // MARK: Private properties

    private lazy var safariApi = ExtensionSafariApiClientImpl()
    private lazy var filtersStorage: FiltersStorage = {
        let fileManager = AMFileManagerImpl()
        let fileStorage = GroupFolderFileServiceImpl(fileManager: fileManager)
        return FiltersStorageImpl(fileStorage: fileStorage)
    }()

    // MARK: Init

    private init() {
        let subsystem = Subsystem.safariPopup
        LogConfig.setupSharedLogger(for: subsystem)
    }
}
