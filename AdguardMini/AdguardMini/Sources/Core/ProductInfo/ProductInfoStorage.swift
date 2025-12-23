// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ProductInfoStorage.swift
//  AdguardMini
//

import Foundation
import AML

protocol ProductInfoStorage {
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
