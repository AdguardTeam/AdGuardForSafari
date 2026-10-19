// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  DIContainer.swift
//  AdguardMini
//

/// A class containing all the objects needed for the popup
///
/// - Note: Should be inited as soon as possible: it also configures the logger
final class DIContainer {
    // MARK: Singleton

    /// `nonisolated(unsafe)` because the container is created once and its lazy
    /// services are read after their first access. The class stays
    /// non-Sendable, so the compiler still rejects passing an instance between
    /// isolation domains.
    nonisolated(unsafe) static let shared: DIContainer = DIContainer()

    // MARK: Public properties

    private(set) lazy var safariApiInteractor: SafariApiInteractor = SafariApiInteractorImpl(
        safariApi: self.safariApi
    )

    private(set) lazy var sharedSettingsStorage: SharedSettingsStorage = SharedSettingsStorageImpl()

    // MARK: Private properties

    private lazy var safariApi = ExtensionSafariApiClientImpl()

    // MARK: Init

    private init() {
        let subsystem = Subsystem.safariPopup
        LogConfig.setupSharedLogger(for: subsystem)
    }
}
