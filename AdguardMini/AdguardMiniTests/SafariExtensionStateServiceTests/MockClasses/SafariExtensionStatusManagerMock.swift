// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionStatusManagerMock.swift
//  AdguardMiniTests
//

extension SafariExtensionStatusManagerMock {
    struct Configuration {
        let isExtensionEnabled: Bool
    }

    enum MockType {
        case extEnabled
        case extNotEnabled

        private func createConfiguration() -> Configuration {
            switch self {
            case .extEnabled:
                Configuration(isExtensionEnabled: true)
            case .extNotEnabled:
                Configuration(isExtensionEnabled: false)
            }
        }

        func createObject() -> SafariExtensionStatusManager {
            SafariExtensionStatusManagerMock(configuration: self.createConfiguration())
        }
    }
}

class SafariExtensionStatusManagerMock: SafariExtensionStatusManager {
    private let configuration: Configuration

    init(configuration: Configuration) {
        self.configuration = configuration
    }

    var isAllExtensionsEnabled: Bool { fatalError("Usage is not expected") }
    var firstDisabledExtensionId: String? { fatalError("Usage is not expected") }

    func checkIfExtensionEnabled(_ type: SafariBlockerType) -> Bool {
        self.configuration.isExtensionEnabled
    }
}
