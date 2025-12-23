// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariWebExtensionHandler.swift
//  WebExt
//

import SafariServices

import AML
import FilterEngine

// MARK: - Constants

private enum Constants {
    static let urlField = "url"
}

private enum BrowserAction {
    static let advancedBlockingData = "getAdvancedBlockingData"
    static let extraStatus = "extraStatusUpdate"
}

// MARK: - SafariWebExtensionHandler

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    private let webExtension: WebExtension?
    private let sharedSettingsStorage: SharedSettingsStorage
    private let safariApi: SafariApiInteractor

    override init() {
        self.webExtension = WebExtensionDIContainer.shared.webExtension
        self.sharedSettingsStorage = DIContainer.shared.sharedSettingsStorage
        self.safariApi = DIContainer.shared.safariApiInteractor

        super.init()
    }

    func beginRequest(with context: NSExtensionContext) {
        LogInfo("SafariWebExtension received a request: \(context)")
        guard let item = context.inputItems.first as? NSExtensionItem,
              let userInfo = item.userInfo as? [String: Any],
              let message = userInfo[SFExtensionMessageKey] as? [String: Any],
              let action = message["action"] as? String
        else {
            LogError("Bad context: \(context)")
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }

        Task {
            let returningItems: [Any] =
            if action == BrowserAction.advancedBlockingData {
                self.processAdvancedBlockingsRequest(message: message)
            } else if action == BrowserAction.extraStatus {
                await self.processAdGuardExtraRequest(message: message)
            } else {
                []
            }

            context.completeRequest(returningItems: returningItems, completionHandler: nil)
        }
    }

    private func processAdvancedBlockingsRequest(message: [String: Any]) -> [Any] {
        guard self.sharedSettingsStorage.protectionEnabled,
              self.sharedSettingsStorage.advancedRules
        else {
            LogError("Prevent advanced rules dispatching for some reasons.")
            return []
        }

        let responseUserInfo = self.webExtension
            .processScriptMessageAndGetResponseUserInfo(
                message
            )

        guard !responseUserInfo.isEmpty else {
            return []
        }

        let response = NSExtensionItem()
        response.userInfo = [
            SFExtensionMessageKey: responseUserInfo
        ]

        return [response]
    }

    private func processAdGuardExtraRequest(message: [String: Any]) async -> [Any] {
        let response = NSExtensionItem()
        // Check is host in allowlist later
        var isExtraActive = false
        if let url = message[Constants.urlField] as? String {
            isExtraActive = (try? await self.safariApi.getExtraState(withUrl: url)) ?? false
        }
        let isActive = self.sharedSettingsStorage.protectionEnabled && isExtraActive
        response.userInfo = [
            SFExtensionMessageKey: [
                "isActive": isActive,
                "verbose": Logger.shared.logLevel == .debug,
                "requestId": message["requestId"] ?? ""
            ]
        ]

        return [response]
    }
}
