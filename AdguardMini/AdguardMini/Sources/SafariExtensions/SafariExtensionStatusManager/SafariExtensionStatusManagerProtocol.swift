// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionStatusManager.swift
//  AdguardMini
//

// MARK: - SafariExtensionStatusManager

protocol SafariExtensionStatusManager {
    var isAllExtensionsEnabled: Bool { get async }
    var firstDisabledExtensionId: String? { get async }

    func checkIfExtensionEnabled(_ type: SafariBlockerType) async -> Bool
}
