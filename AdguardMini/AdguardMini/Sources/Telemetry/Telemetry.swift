// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Telemetry.swift
//  AdguardMini
//

import Foundation
import CryptoKit
import AML

// MARK: - Constants

private enum Constants {
    static let apiURL: URL = {
        #if DEBUG
        let host = "https://telemetry.service.agrd.dev"
        #else
        let host = "https://api.agrd-tm.com"
        #endif
        var baseURL = URL(string: host)!
        if let devConfigHost = DeveloperConfigUtils[.telemetryApiUrl] as? String {
            if let url = URL(string: devConfigHost) {
                baseURL = url
            } else {
                LogError("Invalid devConf value for \(DeveloperConfigUtils.Property.telemetryApiUrl): \(devConfigHost)")
            }
        }
        return baseURL.appendingPathComponent("/api/v1/event", conformingTo: .url)
    }()
}

// MARK: - Telemetry

enum Telemetry {
    enum Event {
        case pageview(Pageview)
        case customEvent(CustomEvent)
    }

    struct Pageview {
        /// Name of shown page, e.g. "settings\_screen".
        let name: String
        /// Name of referrer page, e.g. "stats\_screen".
        let refName: String?
    }

    struct CustomEvent {
        /// Name of this custom event, e.g. "purchase".
        let name: String
        /// Name of page where custom event occurs, e.g. "login\_screen".
        let refName: String
        let action: String?
        let label: String?
    }
}

// MARK: - Telemetry.Service

extension Telemetry {
    protocol Service {
        func sendEvent(_ event: Event) async
    }
}

// MARK: - Telemetry.ServiceImpl

extension Telemetry {
    final actor ServiceImpl: Telemetry.Service {
        private let network: NetworkManager
        private let settings: UserSettingsManager
        private let appMetadata: AppMetadata
        private let licenseStateProvider: LicenseStateProvider
        private let telemetry: AML.Telemetry

        init(
            network: NetworkManager,
            settings: UserSettingsManager,
            appMetadata: AppMetadata,
            licenseStateProvider: LicenseStateProvider
        ) {
            self.network = network
            self.settings = settings
            self.appMetadata = appMetadata
            self.licenseStateProvider = licenseStateProvider
            self.telemetry = AML.Telemetry(
                syntheticId: SyntheticId.get(),
                appType: .miniMac,
                appVersion: BuildConfig.AG_REPORTED_VERSION
            )
        }

        func sendEvent(_ event: Telemetry.Event) async {
             guard self.settings.allowTelemetry else { return }

            guard let request = await self.createRequest(for: event) else {
                LogDebug("Can't create telemetry request")
                return
            }

            do {
                let response = try await self.network.data(request: request)
                if response.code / 100 != 2 {
                    LogDebug("Error sending telemetry event: HTTP status code \(response.code)")
                }
                LogDebug("Telemetry sent")
            } catch {
                LogDebug("Error sending telemetry event: \(error)")
            }
        }

        private func createRequest(for event: Event) async -> URLRequest? {
            let event: AML.Telemetry.Event = switch event {
            case .pageview(let event):
                    .pageview(name: event.name, refName: event.refName)
            case .customEvent(let event):
                    .custom(name: event.name, refName: event.refName)
            }

            let props = AML.Telemetry.Props(
                subscriptionDuration: await self.getSubscriptionDuration(),
                licenseStatus: await self.getLicenseStatus(),
                theme: self.getTheme(),
                retentionCohort: self.getRetentionCohort()
            )

            return self.telemetry.eventRequest(
                url: Constants.apiURL,
                event: event,
                props: props
            )
        }

        private func getSubscriptionDuration() async -> AML.Telemetry.SubscriptionDuration? {
            guard let info = await self.licenseStateProvider.getStoredInfo() else {
                return nil
            }

            if info.licenseLifetime ?? false {
                return .lifetime
            }

            if let duration = info.subscriptionStatus?.duration {
                return switch duration {
                case .monthly: .monthly
                case .yearly:  .annual
                }
            }

            LogError("Unexpected license state: license exists but has no lifetime or duration field")
            return nil
        }

        private func getLicenseStatus() async -> AML.Telemetry.LicenseStatus? {
            guard let info = await self.licenseStateProvider.getStoredInfo() else {
                return nil
            }

            return switch info.licenseStatus {
            case .trial:  .trial
            case .active: .premium
            default:      .other
            }
        }

        private func getTheme() -> AML.Telemetry.Theme {
            UIUtils.isDarkMode() ? .systemDark : .systemLight
        }

        private func getRetentionCohort() -> AML.Telemetry.RetentionCohort {
            guard let firstStartDate = self.appMetadata.firstStartDate else {
                return .longtime
            }

            let duration = Date.now.timeIntervalSince(firstStartDate)
            if duration > 30.days { return .longtime }
            if duration > 7.days { return .month1 }
            if duration > 1.day { return .week1 }

            return .day1
        }
    }
}

extension Telemetry {
    private enum SyntheticId {
        @UserDefault(.telemetryId)
        static var stored: String?

        private static let lock = UnfairLock()
        private static var runtime: String?

        static func get() -> String {
            locked(self.lock) {
                if let id = self.runtime {
                    return id
                }

                if let id = self.stored,
                   self.isValid(id) {
                    self.runtime = id
                    return id
                }

                let new = self.create()
                self.stored = new
                self.runtime = new
                return new
            }
        }

        static func create() -> String {
            let syntheticIdLength = 8
            let syntheticIdCharacters: [Character] = Array("abcdef123456789")

            let randomBytes = SymmetricKey(size: .bits256)
                .withUnsafeBytes { Array($0.prefix(syntheticIdLength)) }

            let characters = randomBytes.map { byte in
                syntheticIdCharacters[Int(byte) % syntheticIdCharacters.count]
            }

            return String(characters)
        }

        static func isValid(_ value: String) -> Bool {
            value.range(of: #"^[a-f1-9]{8}$"#, options: .regularExpression) != nil
        }
    }
}
