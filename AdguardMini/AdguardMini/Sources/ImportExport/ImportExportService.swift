// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ImportExportService.swift
//  AdguardMini
//

import Foundation

import AML
import FLM

enum ImportExportError: Error {
    case invalidPath
}

// MARK: - Constants

fileprivate enum Constants {
    static let archiveExt = BuildConfig.AG_EXCHANGE_SETTINGS_FILE_EXTENSION
    /// Extension of AdGuard for Safari settings file.
    static let legacySettingsExt = "json"
}

// MARK: - ImportExportService

protocol ImportExportService: AnyObject {
    func saveFile<T: Encodable>(obj: T, path: String) async throws
    func loadFile<T: Decodable>(path: String) async -> Result<T, Error>

    func savePlainFile(obj: String, path: String) async throws
    func loadPlainFile(path: String) async -> Result<String, Error>

    func exportSettings(path: String) async throws

    func fetchSettingsForImport(path: String) async
    func importSettings(_ mode: ImportMode) async
}

enum ImportError: ConvertableError {
    case
    createExportFolder(Error),
    uncompress,
    emptyArchive,
    invalidArchive,
    noTempImportedFile,
    unsupportedImportVersion,
    fatal
}

public enum ImportMode {
    case
    full,
    withoutAnnoyance,
    cancel
}

// MARK: - ImportExportService implementation

final class ImportExportServiceImpl: ImportExportService {
    private let userSettingsService: UserSettingsService

    private let filtersSupervisor: FiltersSupervisor

    private let legacyMapper: LegacyMapper
    private lazy var exchangeApi = ExchangeSettingsServices(filtersSupervisor: self.filtersSupervisor)
    private lazy var importer: SettingsImportFile = SettingsImportFile(
        api: self.exchangeApi,
        userSettingsService: self.userSettingsService,
        mapper: self.legacyMapper
    )
    private lazy var exporter: SettingsExportProtocol = SettingsExport(api: self.exchangeApi)

    private let eventBus: EventBus

    private var prefetched: [ExchangeSettingsContainer] = []

    typealias ExchangeProtocolVersion = (version: ExchangeVersions, protocol: ExchangeProtocol)

    private let actualVersion: ExchangeProtocolVersion = (.one, ExchangeProtocolImpl1())

    private let supportedVersions: [ExchangeProtocolVersion]

    init(
        userSettingsService: UserSettingsService,
        filtersSupervisor: FiltersSupervisor,
        legacyMapper: LegacyMapper,
        eventBus: EventBus
    ) {
        self.userSettingsService = userSettingsService
        self.filtersSupervisor = filtersSupervisor
        self.legacyMapper = legacyMapper
        self.eventBus = eventBus
        self.supportedVersions = [self.actualVersion]
    }

    func exportSettings(path: String) async throws {
        let result = await self.exporter.export(to: URL(fileURLWithPath: path))
        switch result {
        case .success(let url):
            LogInfo("Settings exported to \(url.path)")
        case .failure(let error):
            throw error
        }
    }

    func fetchSettingsForImport(path: String) async {
        do {
            let url = URL(fileURLWithPath: path)
            if url.pathExtension != Constants.archiveExt && url.pathExtension != Constants.legacySettingsExt {
                throw ImportError.invalidArchive.log()
            }
            let prefetched = try await self.importer.prefetchImport(url)
            self.prefetched = prefetched

            // Check if there is a annoyance filters in import

            let annoyanceFiltersIds = await self.filtersSupervisor.getFiltersIndex().annoyanceFiltersIds

            var mustGiveConsentForFilters: [Int] = []

            for container in prefetched where container.manifest.settingsType != .preferences {
                guard let id = container.payload["filterId"] as? Int else { continue }
                if annoyanceFiltersIds.contains(id) && !self.userSettingsService.userConsent.contains(id) {
                    mustGiveConsentForFilters.append(id)
                }
            }

            if !mustGiveConsentForFilters.isEmpty {
                self.eventBus.post(
                    event: .importStateChange,
                    userInfo: ImportStatusDTO(success: false, consentFiltersIds: mustGiveConsentForFilters)
                )
            } else {
                await self.importSettings(.full)
            }
        } catch {
            self.eventBus.post(event: .importStateChange, userInfo: ImportStatusDTO(success: false))
        }
    }

    func importSettings(_ mode: ImportMode) async {
        let isStarted = self.filtersSupervisor.isStarted
        do {
            let containers = self.prefetched
            guard !containers.isEmpty else {
                throw ImportError.noTempImportedFile.log()
            }

            self.prefetched = []

            guard mode != .cancel else {
                self.eventBus.post(event: .importStateChange, userInfo: ImportStatusDTO(success: true))
                return
            }

            if isStarted {
                self.filtersSupervisor.stop()
            }

            defer {
                if isStarted { self.filtersSupervisor.start() }
            }

            let prevHardwareAcc = self.userSettingsService.settings.hardwareAcceleration

            let annoyanceFiltersIds = await self.filtersSupervisor.getFiltersIndex().annoyanceFiltersIds

            try await self.importer.importItems(
                containers,
                mode: mode,
                annoyanceFiltersIds: annoyanceFiltersIds
            )
            self.eventBus.post(event: .importStateChange, userInfo: ImportStatusDTO(success: true))

            if let container = containers.first(where: { $0.manifest.settingsType == .preferences }),
               let hardwareAcc = container.payload["hardwareAcceleration"] as? Bool,
               prevHardwareAcc != hardwareAcc {
                // Temporarily skip handling hardware acceleration changes
                // TEMP: self.eventBus.post(event: .hardwareAccelerationChanged, userInfo: hardwareAcc)
            }
        } catch {
            self.eventBus.post(event: .importStateChange, userInfo: ImportStatusDTO(success: false))
        }
    }

    func saveFile<T: Encodable>(obj: T, path: String) async throws {
        let url = URL(fileURLWithPath: "\(path)")
        try await self.saveFile(obj: obj, url: url)
    }

    func saveFile<T: Encodable>(obj: T, url: URL) async throws {
        let result = await Task {
            let data = try JSONEncoder().encode(obj)
            try data.write(to: url, options: .atomic)
        }.result
        if case .failure(let error) = result {
            throw error
        }
    }

    func savePlainFile(obj: String, path: String) async throws {
        let url = URL(fileURLWithPath: "\(path)")
        try await Task {
            try Data(obj.utf8).write(to: url, options: .atomic)
        }.value
    }

    func loadFile<T: Decodable>(path: String) async -> Result<T, Error> {
        let url = URL(fileURLWithPath: path)
        return await self.loadFile(url: url)
    }

    func loadFile<T: Decodable>(url: URL) async -> Result<T, Error> {
        await Task {
            let result: Result<T, Error>
            do {
                let data = try Data(contentsOf: url)
                let obj = try JSONDecoder().decode(T.self, from: data)
                return .success(obj)
            } catch {
                result = .failure(error)
            }
            return result
        }.value
    }

    func loadPlainFile(path: String) async -> Result<String, Error> {
        let url = URL(fileURLWithPath: path)
        return await Task {
            let result: Result<String, Error>
            do {
                let data = try Data(contentsOf: url)
                result = .success(String(decoding: data, as: Unicode.UTF8.self))
            } catch {
                result = .failure(error)
            }
            return result
        }.value
    }
}
