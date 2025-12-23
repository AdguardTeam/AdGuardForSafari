// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionStateStorageMock.swift
//  AdguardMiniTests
//

extension SafariExtensionStateStorageMock {
    struct Configuration {
        let isUpdateSucceed: Bool
    }

    enum MockType {
        case updateSuccess
        case updateFailed

        private func createConfiguration() -> Configuration {
            switch self {
            case .updateSuccess:
                Configuration(isUpdateSucceed: true)
            case .updateFailed:
                Configuration(isUpdateSucceed: false)
            }
        }

        func createObject() -> SafariExtensionStateStorage {
            SafariExtensionStateStorageMock(configuration: self.createConfiguration())
        }
    }
}

class SafariExtensionStateStorageMock: SafariExtensionStateStorage {
    private var stateHolder: [SafariBlockerType: SafariExtension.State]
    private var extensionsInProgress: Set<SafariBlockerType>

    private let configuration: Configuration

    init(
        stateHolder: [SafariBlockerType: SafariExtension.State] = [:],
        extensionsInProgress: Set<SafariBlockerType> = [],
        configuration: Configuration
    ) {
        self.stateHolder = stateHolder
        self.extensionsInProgress = extensionsInProgress
        self.configuration = configuration
    }

    func checkIsInProgress(_ type: SafariBlockerType) -> Bool {
        self.extensionsInProgress.contains(type)
    }

    func setInProgress(_ inProgress: Bool, for type: SafariBlockerType) {
        if inProgress {
            self.extensionsInProgress.insert(type)
        } else {
            self.extensionsInProgress.remove(type)
        }
    }

    func getState(_ type: SafariBlockerType) -> SafariExtension.State? {
        self.stateHolder[type]
    }

    func updateState(_ type: SafariBlockerType, _ newState: SafariExtension.State) async -> Bool {
        let isUpdateSucceed = self.configuration.isUpdateSucceed
        if isUpdateSucceed {
            self.stateHolder[type] = newState
        }
        return isUpdateSucceed
    }
}
