// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SettingsImportBase.swift
//  Adguard
//

import Cocoa
import AML

// MARK: DECLARATION -

// MARK: Protocols for APIs, which Import uses for modifying data in app

/// Service protocol, which importing procedure use, common API.
protocol SettingsImportBaseApiService {
    /// User rules id.
    var userRulesId: Int { get }
    /// Returns app bundle id.
    func bundleId() -> String
    /// Returns group bundle id.
    func groupBundleId() -> String
    /// Begins database transaction.
    /// - Returns: Returns true on success.
    func beginDbTransaction() -> Bool
    /// Rollbaks database transaction.
    /// - Returns: Returns true on success.
    func rollbackDbTransaction() -> Bool
    /// Commit database transaction.
    /// - Returns: Returns true on success.
    func commitDbTransaction() -> Bool
}

/// Service protocol, which importing procedure use, blocking filters API.
protocol SettingsImportBlockingFilterApiService {
    /// Removes all filters.
    /// - Returns: Returns true on success.
    func removeFilters() async -> Bool

    /// Adds filter, performing validity checks of a filter metadata.
    /// - Parameter dto: Representation, which contains filter metadata and rules.
    /// - Returns: Returns true on success.
    func importFilter(_ dto: FilterDTO) async -> Bool

    /// Disable all filters which has group Id not in enabledGroups, except custom.
    /// - Parameter enabledGroups: All enabled groups.
    func disableGroupSpecificFilters(notIn enabledGroups: Set<Int>) async
}

protocol SettingsImportApiService:
    SettingsImportBaseApiService,
    SettingsImportBlockingFilterApiService {}

// MARK: SettingsImportBase Interface

extension SettingsImportBase {
    /// Objective C compatible SettingsImportBase errors
    enum Error: ConvertableError {
        case
        prepareDB,
        commitDB,
        clear,
        applyPrefs,
        applyFilters,
        fatal
    }
}

// MARK: SettingsImportBase Implementation

/// Base class for services, which imports an app settings.
class SettingsImportBase {
    // MARK: Context definition

    final class Context {
        var currentProcessedFileUrl: URL?
        var preferencesImported = false
        var importedBlockingFilterIds = Set<Int>()
        var settingsModified = false
    }

    // MARK: Public

    let queue = DispatchQueue(label: #fileID)
    var context = Context()
    var apiService: SettingsImportApiService!
    let userSettingsService: UserSettingsService

    init(userSettingsService: UserSettingsService) {
        self.userSettingsService = userSettingsService
    }

    func stopImport(progress: Progress, error: Swift.Error?) throws {
        // MAIN RETURN
        var error = error
        if progress.isCancelled {
            error = ExchangeSettingsModelError.canceled
        }

        progress.undoManager.endUndoGrouping()
        if let error {
            if !(error is Error) {
                LogError("Error occurred: \(error)")
            }
            LogInfo("Performing UNDO")
            progress.undoManager.undo()
            throw error
        }

        progress.undoManager.removeAllActions()
        let kind = progress.kind?.rawValue ?? "AdGuard Mini settings importing"
        LogInfo("\(kind) finished")
    }

    func prepareStorages(progress: Progress) throws {
        // Prepare Preferences
        let bundleId = self.apiService.bundleId()
        guard let defaults = UserDefaults().persistentDomain(forName: bundleId) else {
            throw Error.fatal.log()
        }
        progress.undoManager.registerUndo(withTarget: self.context) { _ in
            UserDefaults().setPersistentDomain(defaults, forName: bundleId)
        }

        // Prepare DB
        guard self.apiService.beginDbTransaction() else {
            throw Error.prepareDB.log()
        }
        progress.undoManager.registerUndo(withTarget: self.context) { _ in
            _ = self.apiService.rollbackDbTransaction()
        }
    }

    func finalizeStorages(progress: Progress) throws {
        guard self.apiService.commitDbTransaction() else {
            throw Error.commitDB.log()
        }
    }

    func clearAllSettings(progress: Progress) async throws {
        try self.clearPreferences(progress: progress)
        try await self.clearBlockingFiltersData(progress: progress)
    }
}

// MARK: Clear Settings Implementation

extension SettingsImportBase {
    private func clearPreferences(progress: Progress?) throws {
        let bundleId = self.apiService.bundleId()
        let groupId = self.apiService.groupBundleId()
        guard let defaults = UserDefaults().persistentDomain(forName: bundleId) else {
            throw Error.fatal.log()
        }

        // Preserve keys that are not involved in the import
        let prefKeys = ExchangeSettingsModel.Preferences.allKeys

        let modifiedDefaults = defaults.filter { !prefKeys.contains($0.key.lowercasedFirstLetter()) }

        UserDefaults().setPersistentDomain(modifiedDefaults, forName: bundleId)

        if let groupDefaults = UserDefaults().persistentDomain(forName: groupId) {
            let modifiedGroupDefaults = groupDefaults.filter { !prefKeys.contains($0.key.lowercasedFirstLetter())
            }
            UserDefaults().setPersistentDomain(modifiedGroupDefaults, forName: groupId)
        } else {
            LogWarn("Can't clear group preferences because group defaults domain doesn't exist.")
        }
    }

    private func clearBlockingFiltersData(progress: Progress?) async throws {
        guard await self.apiService.removeFilters() else {
            LogError("Can't remove blocking filters data")
            throw Error.clear.log()
        }
    }
}

// MARK: Import entities implementation

extension SettingsImportBase {
    func importPreferences(entity: [String: Any], progress: Progress) throws {
        let bundleId = self.apiService.bundleId()
        let groupBundleId = self.apiService.groupBundleId()

        var entity = entity

        let df = UserDefaults()
        let defaults = df.persistentDomain(forName: bundleId) ?? [:]
        let groupDefaults = df.persistentDomain(forName: groupBundleId) ?? [:]

        entity = entity
            .merging(defaults) { old, _ in old }
            .merging(groupDefaults) { old, _ in old }

        if progress.isCancelled {
            return
        }

        /// Exclude keys with side effects.
        let excludedKeys = [SettingsKey.realTimeFiltersUpdate, SettingsKey.showInMenuBar].map(\.rawValue)
        let appKeys = SettingsKey.allCases.map(\.rawValue).filter { !excludedKeys.contains($0) }
        let sharedKeys = SharedSettingsKey.allCases.map(\.rawValue)

        df.setPersistentDomain(entity.filter { appKeys.contains($0.key) }, forName: bundleId)
        df.setPersistentDomain(entity.filter { sharedKeys.contains($0.key) }, forName: groupBundleId)

        guard df.synchronize()
        else {
            throw Error.applyPrefs.log()
        }

        // Handle settings with side effects

        if let realTimeFiltersUpdate = entity[SettingsKey.realTimeFiltersUpdate.rawValue] as? Bool {
            self.userSettingsService.setRealTimeFiltersUpdate(realTimeFiltersUpdate)
        }
        if let showInMenuBar = entity[SettingsKey.showInMenuBar.rawValue] as? Bool {
            self.userSettingsService.setShowInMenuBar(showInMenuBar)
        }

        self.context.preferencesImported = true
    }

    func importBlockingFilter(entity: FilterDTO, progress: Progress) async throws {
        guard let meta = entity.meta
        else {
            LogError("Can't getting filterId from meta:\n\(String(describing: entity.meta))\n")
            throw Error.applyFilters.log()
        }

        let id = meta.filterId

        guard self.context.importedBlockingFilterIds.insert(id).inserted else {
            LogError("Blocking filter with id: \(id), already imported, ignored this file")
            throw Error.applyFilters.log()
        }

        guard await self.apiService.importFilter(entity)
        else {
            LogError("Can't import blocking filter with id: \(id).")
            throw Error.applyFilters.log()
        }
    }
}

// MARK: SettingsImportBase.Error Implementation

extension SettingsImportBase.Error {
    static var errorDomain: String = "SettingsImportErrorDomain"

    /// A localized message describing what error occurred.
    var errorDescription: String? {
        switch self {
        case .applyPrefs:
            ".localized.exchangeSettings.apply_error_prefs"

        case .applyFilters:
            ".localized.exchangeSettings.apply_error_filters"

        default:
            ".localized.base.exchange_settings_unknown_error_message"
        }
    }

    /// Debug description of an error, which is displayed in debug console
    var errorDebugDescription: String? {
        switch self {
        case .prepareDB:
            "Can't prepare DB for new transaction"

        case .commitDB:
            "Can't commit DB"

        case .clear:
            "Can't clear data in storages, before importing"

        case .fatal:
            "Silent assert. It shouldn't have happened because it can't be."

        case .applyPrefs:
            "Applying prefs failed"

        case .applyFilters:
            "Applying filters failed"
        }
    }
}
