// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersDbStorage.swift
//  AdguardMini
//

// MARK: - FiltersDbStorage

protocol FiltersDbStorage: FileStorageProtocol {}

// MARK: - FiltersDbStorageImpl

final class FiltersDbStorageImpl: GenericFileStorage, FiltersDbStorage {
    override init(fileStorage: FileStorageProtocol, origin: FolderLocation = .filtersDb) {
        super.init(fileStorage: fileStorage, origin: origin)
    }
}
