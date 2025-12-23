// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WebExtension+Utils.swift
//  AdguardMini
//

import Foundation

import AML
import FilterEngine

private enum Constants {
    static let requestIdField = "requestId"
    static let requestedAtField = "requestedAt"

    // Request fields

    static let urlField = "url"
    static let topUrlField = "topUrl"

    // Response fields

    static let payloadField = "payload"
    static let verboseField = "verbose"
}

extension WebExtension {
    /// Looks up filtering rules in the filtering engine.
    ///
    /// The payload includes the CSS, extended CSS, JS code, and an array of
    /// scriptlet data (name and arguments), which is then sent to the content
    /// script.
    ///
    /// - Parameters:
    ///   - pageUrl: URL of the page where the rules should be applied.
    ///   - topUrl: URL of the page from which the iframe was loaded. Only makes sense for subdocuments.
    /// - Returns: A dictionary ready to be sent as the payload.
    func lookup(pageUrl: URL, topUrl: URL?) -> [String: Any] {
        guard let configuration = self.lookup(pageUrl: pageUrl, topUrl: topUrl) else {
            return [:]
        }

        var payload: [String: Any] = [:]
        // Add the primary configuration components.
        payload["css"] = configuration.css
        payload["extendedCss"] = configuration.extendedCss
        payload["js"] = configuration.js

        // Prepare an array to hold dictionary representations of each scriptlet.
        var scriptlets: [[String: Any]] = []
        for scriptlet in configuration.scriptlets {
            var scriptletData: [String: Any] = [:]
            // Include the scriptlet name and arguments.
            scriptletData["name"] = scriptlet.name
            scriptletData["args"] = scriptlet.args
            scriptlets.append(scriptletData)
        }

        payload["scriptlets"] = scriptlets

        return payload
    }

    func processScriptMessageAndGetResponseUserInfo(_ message: [String: Any]) -> [String: Any] {
        // Retrieve the URL string from the incoming message.
        let requestId    = message[Constants.requestIdField]   as? String ?? ""
        let urlString    = message[Constants.urlField]         as? String ?? ""
        let topUrlString = message[Constants.topUrlField]      as? String
        let requestedAt  = message[Constants.requestedAtField] as? Int ?? 0

        guard let url = URL(string: urlString)
        else {
            return [:]
        }

        var topUrl: URL?
        if let topUrlString {
            topUrl = URL(string: topUrlString)
        }

        let payload: [String: Any] = self.lookup(pageUrl: url, topUrl: topUrl)

        guard !payload.isEmpty else {
            return [:]
        }

        // Dispatch the payload back to the web page under the same message name.
        let responseUserInfo: [String: Any] = [
            Constants.requestIdField: requestId,
            Constants.payloadField: payload,
            Constants.requestedAtField: requestedAt,
            Constants.verboseField: Logger.shared.logLevel == .debug
        ]

        LogDebug("Payload: \(responseUserInfo)")

        return responseUserInfo
    }
}

extension WebExtension? {
    func processScriptMessageAndGetResponseUserInfo(_ message: [String: Any]) -> [String: Any] {
        guard let self else {
            return [:]
        }

        return self.processScriptMessageAndGetResponseUserInfo(message)
    }
}
