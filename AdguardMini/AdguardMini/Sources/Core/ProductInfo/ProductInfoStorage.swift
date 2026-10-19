// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ProductInfoStorage.swift
//  AdguardMini
//

import Foundation
import AML

/// `Sendable` because the implementation holds only an immutable collaborator.
protocol ProductInfoStorage: Sendable {
    var applicationId: String { get async }
}

final class ProductInfoStorageImpl: ProductInfoStorage {
    private let keychain: KeychainManager

    init(keychain: KeychainManager) {
        self.keychain = keychain
    }

    var applicationId: String {
        get async {
            await ProductInfo.applicationId()
        }
    }
}
