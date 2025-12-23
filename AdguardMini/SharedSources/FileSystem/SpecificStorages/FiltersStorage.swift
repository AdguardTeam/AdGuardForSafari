// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersStorage.swift
//  AdguardMini
//

import Foundation

// MARK: - FiltersStorage

protocol FiltersStorage: FileStorageProtocol {}

// MARK: - FiltersStorageImpl

final class FiltersStorageImpl: GenericFileStorage, FiltersStorage {
    override init(fileStorage: FileStorageProtocol, origin: FolderLocation = .convertedFilters) {
        super.init(fileStorage: fileStorage, origin: origin)
    }
}
