// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  KeychainManager.swift
//  AdguardMini
//

import Foundation
import AML

// MARK: - Constants

private enum Constants {
    static let successStatus: OSStatus = 0
}

// MARK: - Keychain

enum Keychain {
    static func set(key: KeychainKey.Base, value: String) async {
        _ = await Task.detached(priority: .userInitiated) {
            Self.set(key: key, value: value)
        }
        .result
    }

    static func set(key: KeychainKey.Base, value: String) {
        if let data = value.data(using: .utf8) {
            Self.set(key: key.key, data: data)
        } else {
            LogDebug("Can't convert \(value) to data")
        }
    }

    static func delete(key: KeychainKey.Base) async {
        await Self.delete(key: key.key)
    }

    static func delete(key: KeychainKey.Secured) async {
        await Self.delete(key: key.key)
    }

    static func delete(key: String) async {
        _ = await Task.detached(priority: .userInitiated) {
            Self.delete(for: key)
        }
        .value
    }

    static func delete(for key: String) {
        let status = KeyChain.delete(key: key)
        LogDebug("Remove from keychain \(key) status: \(status)")
    }

    static func set(key: String, data: Data) {
        let status = KeyChain.save(key: key, value: data)
        if status != Constants.successStatus {
            LogError("Save to keychain \(key) OSStatus: \(status)")
        }
    }

    static func getValue(for key: String) async -> Data? {
        await Task(priority: .userInitiated) {
            Self.getValue(for: key)
        }.value
    }

    static func getValue(for key: String) async -> String? {
        await Task(priority: .userInitiated) {
            Self.getValue(for: key)
        }.value
    }

    static func getValue(for key: String) -> String? {
        if let data = KeyChain.load(key: key) {
            String(bytes: data, encoding: .utf8)
        } else {
            nil
        }
    }

    static func getValue(for key: String) -> Data? {
        KeyChain.load(key: key)
    }
}

// MARK: - KeychainKey

enum KeychainKey {
    enum Base: String {
        case applicationId
        case debugLogging
        case userActionLastDirectory

        var key: String {
            makeKeyValue(for: self.rawValue)
        }
    }

    enum Secured: String {
        case licenseInfo

        var key: String {
            makeKeyValue(for: self.rawValue)
        }
    }

    private static func makeKeyValue(for key: String) -> String {
        "\(BuildConfig.AG_APP_ID).\(key)"
    }
}
