// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeProtocol.swift
//  AdguardMini
//

import Foundation

protocol SettingsModelProtocol: Codable {
    func advancedBlockingState() -> AdvancedBlockingDTO

    init(data: Data) throws
    init(
        settings: SettingsDTO,
        languageSpecific: Bool,
        advancedBlocking: Bool,
        advancedRules: Bool,
        adguardExtra: Bool
    )
}

protocol FiltersModelProtocol: Codable {
    func toFiltersDTO() -> FiltersDTO
    init(data: Data) throws
    init(filters: FiltersDTO)
}

protocol ExchangeProtocol {
    func getSettingsModel() -> SettingsModelProtocol.Type
    func getFiltersModel() -> FiltersModelProtocol.Type
}
