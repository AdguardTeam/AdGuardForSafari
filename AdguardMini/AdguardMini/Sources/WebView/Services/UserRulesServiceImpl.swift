// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesServiceImpl.swift
//  AdguardMini
//

import AppKit
import Foundation
import ProtoSchema
import AML
import FLM

extension UserRulesServiceImpl: FiltersSupervisorDependent,
                                       ImportExportServiceDependent {}

/// `@unchecked Sendable` because the injected services are assigned once
/// during DI setup and only read afterwards.
final class UserRulesServiceImpl: UserRulesService.ServiceType, @unchecked Sendable {
    var filtersSupervisor: FiltersSupervisor!
    var importExportService: ImportExportService!

    override init() {
        super.init()

        self.setupServices()
    }

    func getUserRules(_ message: EmptyValue, _ promise: sending @escaping (UserRules) -> Void) {
        Task {
            let userRules = await self.getCurrentUserRulesProto()
            promise(userRules)
        }
    }

    func addUserRule(_ message: StringValue, _ promise: sending @escaping (OptionalError) -> Void) {
        Task {
            if await self.filtersSupervisor.addUserRule(message.value) {
                promise(.noError)
            } else {
                promise(.error("Failed to write user rules"))
            }
        }
    }

    func updateUserRules(_ message: UserRules, _ promise: sending @escaping (OptionalError) -> Void) {
        Task {
            guard case .success = UserRulesValidator.validate(message) else {
                LogError("updateUserRules rejected: payload exceeds validation caps")
                promise(.error("User rules exceed the allowed limits"))
                return
            }
            let rules = message.rules.fromProto()
            await self.filtersSupervisor.saveUserRules(rules)

            let userRulesId = Int(self.filtersSupervisor.filtersSpecialIds.userRulesId)
            await self.filtersSupervisor.setFilters([userRulesId], enabled: message.enabled)
            promise(OptionalError(hasError: false))
        }
    }

    func exportUserRules(_ message: Path, _ promise: sending @escaping (OptionalError) -> Void) {
        Task {
            guard PathConfiner.isConfinable(
                message.path,
                granted: PathGrantStore.shared,
                containerRoots: PathConfiner.containerRoots(appGroupIdentifier: BuildConfig.AG_APP_ID)
            ) else {
                promise(.error("Invalid path"))
                LogError("exportUserRules rejected: path not confined")
                return
            }
            do {
                let rules = await self.filtersSupervisor.getUserRulesAsString()
                try await self.importExportService.savePlainFile(
                    obj: rules,
                    path: message.path
                )
                promise(.noError)
            } catch {
                let message = "Can't export user rules \(message.path): \(error)"
                promise(.error(message))
                LogError(message)
            }
        }
    }

    func importUserRules(_ message: Path, _ promise: sending @escaping (UserRulesOrError) -> Void) {
        Task {
            let decision = await UserRulesImportDecision.make(
                isConfined: PathConfiner.isConfinable(
                    message.path,
                    granted: PathGrantStore.shared,
                    containerRoots: PathConfiner.containerRoots(appGroupIdentifier: BuildConfig.AG_APP_ID)
                )
            ) {
                await self.importExportService.loadPlainFile(path: message.path)
            }
            switch decision {
            case .save(let rules):
                await self.filtersSupervisor.saveUserRules(rules)
            case .unreadable(let error):
                LogError("Can't load data from \(message.path): \(error)")
            case .overCap:
                LogError("importUserRules rejected: content exceeds caps")
            case .notConfined:
                LogError("importUserRules rejected: path not confined")
            }
            promise(await decision.reply { await self.getCurrentUserRulesProto() })
        }
    }

    func resetUserRules(_ message: EmptyValue, _ promise: sending @escaping (UserRules) -> Void) {
        Task {
            await self.filtersSupervisor.removeUserRules()
            let userRulesFL = await self.filtersSupervisor.getUserRules()
            promise(
                UserRules(
                    enabled: await self.filtersSupervisor.isUserRulesEnabled(),
                    rules: userRulesFL.toProto()
                )
            )
        }
    }

    private func getCurrentUserRulesProto() async -> UserRules {
        let rules = await self.filtersSupervisor.getUserRules()
        return UserRules(
            enabled: await self.filtersSupervisor.isUserRulesEnabled(),
            rules: rules.toProto()
        )
    }
}
