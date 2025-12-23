// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeSettingsServices.swift
//  Adguard
//

import Foundation

import AML
import FLM

/// Simple thread-safe incremental/decremental counter with loop.
struct Count<T> where T: FixedWidthInteger {
    init(initial: T) {
        self.initial = initial
        self.value = initial
    }

    /// Returns next value
    mutating func next() -> T {
        self.queue.sync {
            let result = self.value
            if self.value == T.max {
                self.value = self.initial
            } else {
                self.value += 1
            }
            return result
        }
    }

    /// Returns previous value
    mutating func prev() -> T {
        self.queue.sync {
            let result = self.value
            if self.value == T.min {
                self.value = self.initial
            } else {
                self.value -= 1
            }
            return result
        }
    }

    private var value: T
    private let initial: T
    private let queue = DispatchQueue(label: "CountQueue")
}

/// Class for implementation some ExchangeSettings APIs protocol, layer between mechanism of settings exchange and application.
final class ExchangeSettingsServices {
    private let filtersSupervisor: FiltersSupervisor

    private var customFilterIdGenerator = Count(initial: FLM.constants.invalidFilterId)

    init(filtersSupervisor: FiltersSupervisor) {
        self.filtersSupervisor = filtersSupervisor
    }
}

// MARK: - SettingsExportApiService Implementation

extension ExchangeSettingsServices: SettingsExportApiService {
    func bundleId() -> String {
        BuildConfig.AG_APP_ID
    }

    func groupBundleId() -> String {
        BuildConfig.AG_GROUP
    }

    // MARK: - SettingsExportBlockingFilterApiService Implementation

    func filters() async -> [FilterMetaDTO] {
        await self.filtersSupervisor.getAllFilters().compactMap { info in
            guard info.isCustom || info.isEnabled else {
                return nil
            }

            return FilterMetaDTO(
                filterId: info.filterId,
                groupId: info.groupId,
                timeUpdated: TimeInterval(info.timeUpdated),
                name: info.name,
                summary: info.summary,
                version: info.version,
                displayNumber: info.displayNumber,
                url: info.url,
                expires: info.expires,
                isCustom: info.isCustom,
                homepage: info.homepage,
                languages: info.languages,
                tags: info.tags.map(\.id),
                isTrusted: info.isTrusted,
                isEnabled: info.isEnabled,
                isInstalled: info.isInstalled
            )
        }
    }

    func rules(for filterId: Int) async -> [FilterRuleDTO] {
        await self.filtersSupervisor.getRules(for: filterId).map { rule in
            FilterRuleDTO(ruleText: rule.ruleText, isEnabled: rule.isEnabled)
        }
    }
}

// MARK: - SettingsImportApiService Implementation

extension ExchangeSettingsServices: SettingsImportApiService {
    var userRulesId: Int {
        self.filtersSupervisor.filtersSpecialIds.userRulesId
    }

    func beginDbTransaction() -> Bool {
        guard self.filtersSupervisor.beginTransaction() else {
            LogInfo("Begin FiltersSupervisor transaction failed")
            return false
        }

        LogInfo("Begin transaction succeeded")
        return true
    }

    func rollbackDbTransaction() -> Bool {
        guard self.filtersSupervisor.rollbackTransaction() else {
            LogInfo("Rollback FiltersSupervisor transaction failed")
            return false
        }

        LogInfo("Rollback transaction succeeded")
        return true
    }

    func commitDbTransaction() -> Bool {
        guard self.filtersSupervisor.commitTransaction() else {
            LogInfo("Commit FiltersSupervisor transaction failed")
            return false
        }

        LogInfo("Commit transaction succeeded")
        return true
    }
}

// MARK: - SettingsImportBlockingFilterApiService Implementation

extension ExchangeSettingsServices: SettingsImportBlockingFilterApiService {
    func removeFilters() async -> Bool {
        await self.filtersSupervisor.removeFilters()
        return true
    }

    // swiftlint:disable:next cyclomatic_complexity
    func importFilter(_ dto: FilterDTO) async -> Bool {
        let service = self.filtersSupervisor

        // Convert metadatas and check filter
        guard var meta = dto.meta
        else { return false }

        let isUserFilter = meta.filterId == service.filtersSpecialIds.userRulesId

        let isCustomFilter = meta.isCustom ?? false

        // Normalize subscription url
        meta.url = {
            guard isCustomFilter else { return "" }
            guard let urlString = meta.url,
                  let url = URL(string: urlString) else { return "" }

            guard url.isFileURL else { return urlString }
            // We does not import subscriptions for local custom filters if they does not exist in current file system
            return FileManager.default.fileExists(atPath: url.path) ? urlString : ""
        }()

        // For custom filter remove previous installation if it exists
        if isCustomFilter, !(meta.url?.isEmpty ?? true) {
            if let filter = await service.getAllFilters().first(where: { $0.url == meta.url }) {
                do {
                    try await service.removeCustomFilters([filter.filterId])
                } catch {
                    LogError("Can't clear previous custom filter \(error)")
                    return false
                }
            }
        }

        guard let rules = dto.rules
        else {
            LogError("Nil rules for filter \(String(describing: meta))")
            return false
        }

        if isCustomFilter {
            meta.expires = min(meta.expires ?? Int.max, 168.hours)

            let body = rules.map(\.ruleText)

            guard let filterToInstall = meta.toCustomFilterDTO(rules: body) else {
                LogError("Failed to convert custom filter \(String(describing: meta))")
                return false
            }

            if body.isEmpty {
                do {
                    try await service.installCustomFilter(
                        from: filterToInstall.downloadUrl,
                        isTrusted: filterToInstall.isTrusted,
                        title: filterToInstall.customTitle,
                        description: filterToInstall.customDescription
                    )
                } catch {
                    LogError("Failed to install custom filter \(String(describing: meta))")
                    return false
                }
            } else {
                let filterId = await service.installCustomFilter(filterToInstall)
                guard filterId != self.filtersSupervisor.filtersSpecialIds.invalidFilterId else {
                    LogError("Failed to install custom filter \(String(describing: meta))")
                    return false
                }
            }
        } else if isUserFilter {
            await service.saveUserRules(rules.map { FilterRule(ruleText: $0.ruleText, isEnabled: $0.isEnabled) })
        }

        await service.setFilters([meta.filterId], enabled: meta.isEnabled ?? true)

        return true
    }

    func disableGroupSpecificFilters(notIn enabledGroups: Set<Int>) async {
        let enabledFilters = await self.filtersSupervisor.getEnabledFilters()

        let filtersForDisable = enabledFilters.compactMap {
            enabledGroups.contains($0.groupId) || $0.isCustom ? nil : $0.filterId
        }

        await self.filtersSupervisor.setFilters(filtersForDisable, enabled: false)
    }
}

extension FilterMetaDTO {
    func toCustomFilterDTO(rules: [String]) -> CustomFilterDTO? {
        let timeUpdated = self.timeUpdated ?? 0
        guard let url = self.url,
              let name = self.name,
              let isEnabled = self.isEnabled,
              let isTrusted = self.isTrusted
        else {
            return nil
        }

        return CustomFilterDTO(
            downloadUrl: url,
            lastDownloadTime: Int64(timeUpdated),
            isEnabled: isEnabled,
            isTrusted: isTrusted,
            rules: rules,
            customTitle: name,
            customDescription: self.summary
        )
    }
}
