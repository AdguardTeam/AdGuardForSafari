// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionStateStorage.swift
//  AdguardMini
//

import Foundation
import AML

// MARK: - SafariExtensionStateStorage

protocol SafariExtensionStateStorage {
    func checkIsInProgress(_ type: SafariBlockerType) async -> Bool
    func setInProgress(_ inProgress: Bool, for type: SafariBlockerType) async

    func getState(_ type: SafariBlockerType) async -> SafariExtension.State?
    @discardableResult
    func updateState(_ type: SafariBlockerType, _ newState: SafariExtension.State) async -> Bool
}

// MARK: - SafariExtensionStateStorageImpl

actor SafariExtensionStateStorageImpl {
    private var stateHolder: [SafariBlockerType: SafariExtension.State] = [:]
    private var extensionsInProgress: [SafariBlockerType: Int] = [:]

    @UserDefault(key: .generalExtensionState, defaultValue: nil)
    private var generalExtensionState: Data?
    @UserDefault(key: .privacyExtensionState, defaultValue: nil)
    private var privacyExtensionState: Data?
    @UserDefault(key: .securityExtensionState, defaultValue: nil)
    private var securityExtensionState: Data?
    @UserDefault(key: .socialWidgetsAndAnnoyancesExtensionState, defaultValue: nil)
    private var socialWidgetsAndAnnoyancesExtensionState: Data?
    @UserDefault(key: .otherExtensionState, defaultValue: nil)
    private var otherExtensionState: Data?
    @UserDefault(key: .customExtensionState, defaultValue: nil)
    private var customExtensionState: Data?
    @UserDefault(key: .advancedExtensionState, defaultValue: nil)
    private var advancedExtensionState: Data?

    private func getData(for type: SafariBlockerType) -> Data? {
        switch type {
        case .general:
            self.generalExtensionState
        case .privacy:
            self.privacyExtensionState
        case .security:
            self.securityExtensionState
        case .socialWidgetsAndAnnoyances:
            self.socialWidgetsAndAnnoyancesExtensionState
        case .other:
            self.otherExtensionState
        case .custom:
            self.customExtensionState
        case .advanced:
            self.advancedExtensionState
        }
    }

    private func setData(_ data: Data, for type: SafariBlockerType) {
        switch type {
        case .general:
            self.generalExtensionState = data
        case .privacy:
            self.privacyExtensionState = data
        case .security:
            self.securityExtensionState = data
        case .socialWidgetsAndAnnoyances:
            self.socialWidgetsAndAnnoyancesExtensionState = data
        case .other:
            self.otherExtensionState = data
        case .custom:
            self.customExtensionState = data
        case .advanced:
            self.advancedExtensionState = data
        }
    }

    private func loadState(_ type: SafariBlockerType) -> SafariExtension.State? {
        var state: SafariExtension.State?
        do {
            if let data = self.getData(for: type) {
                state = try JSONDecoder().decode(
                    SafariExtension.State.self,
                    from: data
                )
            } else {
                LogError("Empty storage for: \(type)")
            }
        } catch {
            LogError("Error decoding extension state: \(error)")
        }
        return state
    }
}

// MARK: - SafariExtensionStateStorage implementation

extension SafariExtensionStateStorageImpl: SafariExtensionStateStorage {
    func checkIsInProgress(_ type: SafariBlockerType) async -> Bool {
        (self.extensionsInProgress[type] ?? 0) != 0
    }

    func setInProgress(_ inProgress: Bool, for type: SafariBlockerType) async {
        let currentValue = self.extensionsInProgress[type] ?? 0
        self.extensionsInProgress[type] = if inProgress {
            currentValue + 1
        } else {
            currentValue > 0 ? currentValue - 1 : 0
        }
    }

    func getState(_ type: SafariBlockerType) async -> SafariExtension.State? {
        if let state = self.stateHolder[type] {
            return state
        }
        let savedState = self.loadState(type)
        self.stateHolder[type] = savedState
        return savedState
    }

    @discardableResult
    func updateState(_ type: SafariBlockerType, _ newState: SafariExtension.State) async -> Bool {
        self.stateHolder[type] = newState

        var result: Bool

        do {
            let data = try JSONEncoder().encode(newState)
            self.setData(data, for: type)
            result = true
        } catch {
            LogError("Error encode \(newState) for type \(type): \(error)")
            result = false
        }

        return result
    }
}
