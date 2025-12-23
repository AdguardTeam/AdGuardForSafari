// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SentryStorage.swift
//  AdguardMini
//

import Foundation

// MARK: - SentryStorage

protocol SentryStorage: FileStorageProtocol {}

// MARK: - SentryStorageImpl

final class SentryStorageImpl: GenericFileStorage, SentryStorage {
    override init(fileStorage: FileStorageProtocol, origin: FolderLocation = .sentryStorage) {
        super.init(fileStorage: fileStorage, origin: origin)
    }

    convenience init() {
        self.init(fileStorage: GroupFolderFileServiceImpl())
    }
}
