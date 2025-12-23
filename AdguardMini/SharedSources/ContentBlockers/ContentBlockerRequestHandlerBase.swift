// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ContentBlockerRequestHandlerBase.swift
//  AdguardMini
//

import Foundation
import AML

private enum Constants {
    static let emptyRulesURI: String = "emptyBlockingRules"
}

// MARK: - ContentBlockerRequestHandlerBase dependencies

extension ContentBlockerRequestHandlerBase:
    FiltersStorageDependent,
    SharedSettingsStorageDependent {}

// MARK: - SSContentBlockerRequestHandlerBase

/// Base class for all content blocker classes
class ContentBlockerRequestHandlerBase: NSObject {
    // MARK: Private properties

    private var emptyRulesProvider: NSItemProvider? {
        let url = Bundle.main.url(forResource: Constants.emptyRulesURI, withExtension: "json")
        return NSItemProvider(contentsOf: url)
    }

    private var currentRulesProvider: NSItemProvider? {
        let url = self.filtersStorage.buildUrl(
            relativePath: Self.blockerContentRulesURI.contentBlockingPath,
            with: "json"
        )

        return NSItemProvider(contentsOf: url)
    }

    // MARK: Public properties

    class var blockerContentRulesURI: SafariBlockerType {
        SafariBlockerType.general
    }

    // MARK: Dependencies

    var filtersStorage: FiltersStorage!
    var sharedSettingsStorage: SharedSettingsStorage!

    // MARK: Init

    override init() {
        super.init()
        self.setupServices()
    }
}

// MARK: - NSExtensionRequestHandling

extension ContentBlockerRequestHandlerBase: NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let attachment =
        self.sharedSettingsStorage.protectionEnabled
        ? self.currentRulesProvider
        : self.emptyRulesProvider

        if let attachment {
            let item = NSExtensionItem()
            item.attachments = [attachment]

            context.completeRequest(returningItems: [item], completionHandler: nil)
        } else {
            LogDebug("No converted or bundled rules")
            context.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
}
