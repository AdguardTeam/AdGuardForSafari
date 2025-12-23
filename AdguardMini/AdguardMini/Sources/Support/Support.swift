// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Support.swift
//  AdguardMini
//

import AppKit
import AML
import AppBackend

// MARK: - Constants

private enum Constants {
    static let stateFilename = "state.txt"

    static var agExtraExtension: ReportsWebAPI.Extension {
        .init(
            name: "AdGuard Extra",
            type: .script,
            url: nil
        )
    }
}

// MARK: - Support

protocol Support: ReportSiteProtocol {
    /// Generates archive with logs.
    /// - Parameters:
    ///   - fileUrl: URL for logs archive.
    ///   - includeState: "State.txt" file with app state.
    ///   - shouldOpenFinder: Should show the archive in the Finder app.
    ///   - completion: Completion with result.
    /// - Returns: Progress of archiving.
    func generateLogsArchive(
        fileUrl: URL,
        includeState: Bool,
        shouldOpenFinder: Bool,
        _ completion: @escaping (Error?) -> Void
    ) async -> Progress

    /// Send message to Support.
    /// - Parameters:
    ///   - email: User's email.
    ///   - subject: Subject of message.
    ///   - description: Description of message.
    ///   - addLogs: Should send logs.
    func sendFeedbackMessage(
        email: String,
        subject: String,
        description: String,
        addLogs: Bool
    ) async throws
}

// MARK: - ReportSiteProtocol

/// A protocol defining an asynchronous API for reporting a site URL as a new filtration issue.
protocol ReportSiteProtocol {
    /// Reports the given site URL to the backend support service and returns
    /// the URL for the newly created issue, if successful.
    ///
    /// - Parameters:
    ///   - reportUrl: The URL of the site to report, or `nil` if no specific URL is provided.
    ///   - from: A string identifier of the screen or context from which the report originates.
    /// - Returns: An optional `URL` pointing to the created issue on the support portal, or `nil` if the report could not be created.
    func reportSiteUrl(reportUrl: String?, from screen: String) async -> URL?
}

// MARK: - Support

/// Aggregates all interaction with user support.
final class SupportImpl {
    private let safariFiltersStorage: SafariFiltersStorage
    private let filtersSupervisor: FiltersSupervisor
    private let supportService: SupportService
    private let productInfo: ProductInfoStorage
    private let userSettings: UserSettingsService
    private let sharedSettings: SharedSettingsStorage
    private let keychain: KeychainManager

    init(
        safariFiltersStorage: SafariFiltersStorage,
        filtersSupervisor: FiltersSupervisor,
        supportService: SupportService,
        productInfo: ProductInfoStorage,
        userSettings: UserSettingsService,
        sharedSettings: SharedSettingsStorage,
        keychain: KeychainManager
    ) {
        self.safariFiltersStorage = safariFiltersStorage
        self.filtersSupervisor = filtersSupervisor
        self.supportService = supportService
        self.productInfo = productInfo
        self.userSettings = userSettings
        self.sharedSettings = sharedSettings
        self.keychain = keychain
    }

    private func createAdditionalFilesDict(state: String?) async -> [String: Any] {
        var dict: [String: Any] = [:]
        for type in SafariBlockerType.allCases {
            if await self.safariFiltersStorage.isRulesExists(for: type) {
                let url = self.safariFiltersStorage.rulesUrl(for: type)
                dict[url.lastPathComponent] = url
            } else {
                LogWarn("Rules file for \(type) not found")
            }
        }
        if let state {
            dict[Constants.stateFilename] = state
        }
        return dict
    }

    private func createState() async -> String {
        let enabledFilters = await self.filtersSupervisor.getEnabledFilters()
            .map { info in
                "ID=\(info.filterId) Name=\(info.name) Version=\(info.version)"
            }

        let thirdPartyDepsVersions = ThirdPartyDependencies.deps.map { dep in
            "\(dep.name) version: \(dep.version)"
        }

        let appStatus = await {
            guard let appStatus = await self.keychain.getAppStatusInfo() else { return "App Status: Unknown/Free" }

            var info = "App Status: \(appStatus.licenseStatus)"
            if let licenseType = appStatus.licenseType {
                info += ", Type: \(licenseType), isAppStore: \(appStatus.isAppStoreSubscription)"
            }
            if let devicesCount = appStatus.licenseComputersCount,
               let devicesMax = appStatus.licenseMaxComputersCount {
                info += ", Devices: \(devicesCount)/\(devicesMax)"
            }
            return info
        }()

        let advancedBlockingState = self.userSettings.advancedBlockingState

        return """
        Application version: \(BuildConfig.AG_FULL_VERSION)
        Application channel: \(BuildConfig.AG_CHANNEL)

        Modules versions:
            \(thirdPartyDepsVersions.joined(separator: "\n    "))

        Application ID: \(await self.productInfo.applicationId)
        \(appStatus)

        Filtration: \(self.sharedSettings.protectionEnabled ? "Enabled" : "Disabled")
            AdvancedRules: \(advancedBlockingState.advancedRules)
            AdGuardExtra:  \(advancedBlockingState.adguardExtra)

        Platform: Mac OS X
        OS: \(ProcessInfo.processInfo.operatingSystemVersionString)
        Locale: \(Locale.canonicalIdentifier(from: Locale.current.identifier))

        Last error: \(AppLogConfig.getLastErrorMessage() ?? "None")

        Enabled filters:
            \(enabledFilters.joined(separator: "\n    "))

        """
    }

    private func generateAttachments(shouldSendLogs: Bool, applicationState: String) async -> RequestFileEntities {
        guard shouldSendLogs else {
            let appState = Data(applicationState.utf8)
            return [
                RequestFileEntity(
                    fileName: Constants.stateFilename,
                    mimeType: MimeType.textPlain.rawValue,
                    fileContent: appState
                )
            ]
        }

        let logsUrl = self.getTempLogsArchiveUrl()

        let error = await withCheckedContinuation { continuation in
            _ = SupportUtils.createArchive(
                at: logsUrl,
                includeItems: [Constants.stateFilename: applicationState],
                for: .sendLogThroughUI,
                startDate: nil,
                showInFinder: false
            ) { error in
                continuation.resume(returning: error)
            }
        }

        if let error {
            LogWarn("Error while generating logs for support: \(error)")
            return []
        }

        do {
            let logsName = logsUrl.lastPathComponent
            let logsData = try Data(contentsOf: logsUrl, options: .mappedIfSafe)
            return [
                RequestFileEntity(
                    fileName: logsName,
                    mimeType: MimeType.applicationZip.rawValue,
                    fileContent: logsData
                )
            ]
        } catch {
            LogWarn("Error while converting logs for support: \(error)")
            return []
        }
    }

    private func getTempLogsArchiveUrl() -> URL {
        let format = DateFormatter()
        format.locale = Locale(identifier: "en_US_POSIX")
        format.dateFormat = "yyyyMMddHHmmss"
        format.timeZone = TimeZone(secondsFromGMT: 0)
        let logsName = "adguard_mini_logs_\(format.string(from: Date())).zip"
        return URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(logsName)
    }
}

// MARK: - ReportSiteProtocol implementation

extension SupportImpl: ReportSiteProtocol {
    func reportSiteUrl(reportUrl: String?, from screen: String) async -> URL? {
        let isPaid = await self.keychain.getAppStatusInfo()?.isPaid ?? false

        var enabledFilterIDs: [Int] = []
        var enabledCustomFilters: [ReportsWebAPI.CustomFilter] = []

        let enabledFilters = await self.filtersSupervisor.getEnabledFilters()

        for filter in enabledFilters {
            if filter.isCustom {
                enabledCustomFilters.append(.init(name: filter.name, url: filter.url))
            } else {
                enabledFilterIDs.append(filter.filterId)
            }
        }

        let isExtraEnabled = self.userSettings.advancedBlockingState.adguardExtra
        let extensions: [ReportsWebAPI.Extension] = [
            Constants.agExtraExtension
        ]

        return await ReportsWebAPI.newIssue(
            tds:               .macMini(appid: self.productInfo.applicationId, from: screen),
            productType:       .macMini,
            productVersion:    BuildConfig.AG_FULL_VERSION,
            licenseType:       isPaid ? .paid : .free,
            browser:           .safari,
            url:               reportUrl,
            filters:           enabledFilterIDs,
            filtersLastUpdate: self.userSettings.lastFiltersUpdateTime,
            customFilters:     enabledCustomFilters.isEmpty ? nil : enabledCustomFilters,
            extensions:        extensions.isEmpty ? nil : extensions,
            extensionsEnabled: isExtraEnabled
        )
    }
}

extension SupportImpl: Support {
    func generateLogsArchive(
        fileUrl: URL,
        includeState: Bool,
        shouldOpenFinder: Bool,
        _ completion: @escaping (Error?) -> Void
    ) async -> Progress {
        var state: String?
        if includeState {
            state = await self.createState()
        }
        return SupportUtils.createArchive(
            at: fileUrl,
            includeItems: await self.createAdditionalFilesDict(state: state),
            for: .sendLogManually,
            startDate: nil,
            showInFinder: shouldOpenFinder,
            completion: completion
        )
    }

    func sendFeedbackMessage(
        email: String,
        subject: String,
        description: String,
        addLogs: Bool
    ) async throws {
        let attachments = await self.generateAttachments(
            shouldSendLogs: addLogs,
            applicationState: await self.createState()
        )

        try await self.supportService.sendFeedbackMessage(
            email: email,
            subject: subject,
            description: description,
            attachments: attachments
        )
    }
}
