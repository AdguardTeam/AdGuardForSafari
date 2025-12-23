// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeSettingsModel_Converters.swift
//  Adguard
//

// swiftlint:disable discouraged_optional_collection

import Foundation

extension ExchangeSettingsModel {
    static func convertPreferencesEntity(
        _ entity: [String: Any],
        from version: ExchangeSettingsVersion,
        lowercaseKeys: Bool = true
    ) throws -> [String: Any]? {
        let entity = lowercaseKeys ? try entity.mapKeys { $0.lowercasedFirstLetter() } : entity

        switch version {
        case "legacy":
            fallthrough

        case Self.version: return entity
        default: return nil
        }
    }
}

// swiftlint:enable discouraged_optional_collection
