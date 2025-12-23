// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WebExtensionDIContainer.swift
//  AdguardMini
//

import ContentBlockerConverter
import FilterEngine

import AML

// MARK: - DIContainer

/// A class containing some important shared dependencies.
final class WebExtensionDIContainer {
    static let shared = WebExtensionDIContainer()

    private var webExtensionHolder: WebExtension?
    var webExtension: WebExtension {
        if let webExtensionHolder {
            return webExtensionHolder
        }

        var engine: WebExtension
        do {
            engine = try WebExtension(
                containerURL: SharedDIContainer.shared.filtersStorage.originDir
            )
        } catch {
            LogError("Failed to create advanced filter engine: \(error)")
            fatalError("Failed to create advanced filter engine: \(error)")
        }
        self.webExtensionHolder = engine
        return engine
    }

    // MARK: Init

    private init() {}
}
