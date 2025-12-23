// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeProtocolImpl1.swift
//  AdguardMini
//

import Foundation

struct ExchangeProtocolImpl1: ExchangeProtocol {
    func getSettingsModel() -> SettingsModelProtocol.Type {
        Self.Settings.self
    }

    func getFiltersModel() -> FiltersModelProtocol.Type {
        Self.Filters.self
    }

    struct Settings: Codable, SettingsModelProtocol {
        let autoFiltersUpdate: Bool
        let realTimeFiltersUpdate: Bool
        let debugLogging: Bool

        let languageSpecific: Bool
        let advancedBlocking: Bool
        let advancedRules: Bool
        let adguardExtra: Bool

        let hardwareAcceleration: Bool
        let launchOnStartup: Bool
        let showInMenuBar: Bool
        let quitReaction: QuitReaction
    }

    struct CustomFilter: Codable {
        let enabled: Bool
        let isTrusted: Bool
        let subscriptionUrl: String
        let rules: [String]
        let title: String
        let lastDownloadTime: Int64
    }

    struct Filters: Codable, FiltersModelProtocol {
        let userRules: [String]
        let userRulesEnabled: Bool
        let enabledBaseFilters: [Int]
        let customFilters: [ExchangeProtocolImpl1.CustomFilter]
    }
}

extension ExchangeProtocolImpl1.Settings {
    func settingsDTO() -> SettingsDTO {
        SettingsDTO(
            autoFiltersUpdate: self.autoFiltersUpdate,
            realTimeFiltersUpdate: self.realTimeFiltersUpdate,
            debugLogging: self.debugLogging,
            hardwareAcceleration: self.hardwareAcceleration,
            launchOnStartup: self.launchOnStartup,
            showInMenuBar: self.showInMenuBar,
            quitReaction: self.quitReaction
        )
    }

    func advancedBlockingState() -> AdvancedBlockingDTO {
        AdvancedBlockingDTO(
            advancedRules: self.advancedRules,
            adguardExtra: self.adguardExtra
        )
    }

    init(data: Data) throws {
        let res = try JSONDecoder().decode(ExchangeProtocolImpl1.Settings.self, from: data)
        self.autoFiltersUpdate = res.autoFiltersUpdate
        self.realTimeFiltersUpdate = res.realTimeFiltersUpdate

        self.debugLogging = res.debugLogging
        self.hardwareAcceleration = res.hardwareAcceleration
        self.launchOnStartup = res.launchOnStartup
        self.showInMenuBar = res.showInMenuBar
        self.quitReaction = res.quitReaction

        self.languageSpecific = res.languageSpecific
        self.advancedBlocking = res.advancedBlocking
        self.advancedRules = res.advancedRules
        self.adguardExtra = res.adguardExtra
    }

    init(
        settings: SettingsDTO,
        languageSpecific: Bool,
        advancedBlocking: Bool,
        advancedRules: Bool,
        adguardExtra: Bool
    ) {
        self.autoFiltersUpdate = settings.autoFiltersUpdate
        self.realTimeFiltersUpdate = settings.realTimeFiltersUpdate
        self.debugLogging = settings.debugLogging
        self.hardwareAcceleration = settings.hardwareAcceleration
        self.launchOnStartup = settings.launchOnStartup
        self.showInMenuBar = settings.showInMenuBar
        self.quitReaction = settings.quitReaction

        self.languageSpecific = languageSpecific
        self.advancedBlocking = advancedBlocking
        self.advancedRules = advancedRules
        self.adguardExtra = adguardExtra
    }
}

extension ExchangeProtocolImpl1.CustomFilter {
    func toCustomFilterDTO() -> CustomFilterDTO {
        CustomFilterDTO(
            downloadUrl: self.subscriptionUrl,
            lastDownloadTime: self.lastDownloadTime,
            isEnabled: self.enabled,
            isTrusted: self.isTrusted,
            rules: self.rules,
            customTitle: self.title,
            customDescription: nil
        )
    }

    init(customFilter: CustomFilterDTO) {
        self.enabled = customFilter.isEnabled
        self.isTrusted = customFilter.isTrusted
        self.subscriptionUrl = customFilter.downloadUrl
        self.rules = customFilter.rules
        self.title = customFilter.customTitle
        self.lastDownloadTime = customFilter.lastDownloadTime
    }
}

extension ExchangeProtocolImpl1.Filters {
    func toFiltersDTO() -> FiltersDTO {
        FiltersDTO(
            userRules: self.userRules,
            userRulesEnabled: self.userRulesEnabled,
            enabledBaseFilters: self.enabledBaseFilters,
            customFilters: self.customFilters.map { cf in cf.toCustomFilterDTO() }
        )
    }

    init(data: Data) throws {
        let res = try JSONDecoder().decode(ExchangeProtocolImpl1.Filters.self, from: data)
        self.userRules = res.userRules
        self.userRulesEnabled = res.userRulesEnabled
        self.enabledBaseFilters = res.enabledBaseFilters
        self.customFilters = res.customFilters
    }

    init(filters: FiltersDTO) {
        self.userRules = filters.userRules
        self.userRulesEnabled = filters.userRulesEnabled
        self.enabledBaseFilters = filters.enabledBaseFilters
        self.customFilters = filters.customFilters.map { cf in ExchangeProtocolImpl1.CustomFilter(customFilter: cf) }
    }
}
