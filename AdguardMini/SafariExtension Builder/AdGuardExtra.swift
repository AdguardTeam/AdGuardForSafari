// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AdGuardExtra.swift
//  AdguardMini Builder
//

import Foundation
import AML

private enum Constants {
    static let scriptURL = URL(string: "https://userscripts.adtidy.org/release/adguard-extra/1.0/adguard-extra.user.js")!
    static let timeout: TimeInterval = 30
}

enum AdGuardExtraError: Error, LocalizedError {
    case cannotReadPlist(path: String)
    case cannotParsePlist(path: String)
    case scriptEntryNotFound
    case invalidScriptEncoding

    var errorDescription: String? {
        switch self {
        case .cannotReadPlist(let path):
            return "Cannot read plist at \(path)"
        case .cannotParsePlist(let path):
            return "Cannot parse plist at \(path)"
        case .scriptEntryNotFound:
            return "Cannot find adguard-extra-injector.js entry in plist"
        case .invalidScriptEncoding:
            return "Downloaded script is not valid UTF-8"
        }
    }
}

func updateAdGuardExtra(
    scriptPath: String,
    infoPlistPath: String,
    force: Bool
) async -> Bool {
    LogInfo("Updating AdGuard Extra...")

    let script: String
    let usedCache: Bool

    if !force, FileManager.default.fileExists(atPath: scriptPath),
       let cached = try? String(contentsOfFile: scriptPath, encoding: .utf8),
       let cachedMeta = try? UserscriptParser.parseMetadata(from: cached) {
        LogInfo("Using cached AdGuard Extra v\(cachedMeta.version) (debug mode)")
        script = cached
        usedCache = true
    } else {
        LogInfo("Downloading from \(Constants.scriptURL.absoluteString)")
        do {
            script = try await downloadScript(from: Constants.scriptURL)
            LogInfo("Downloaded \(script.count) bytes")
            usedCache = false
        } catch {
            LogError("Failed to download AdGuard Extra: \(error.localizedDescription)")
            return false
        }
    }

    let metadata: UserscriptMetadata
    do {
        metadata = try UserscriptParser.parseMetadata(from: script)
    } catch {
        LogError("Failed to parse AdGuard Extra metadata: \(error.localizedDescription)")
        return false
    }

    LogInfo("AdGuard Extra v\(metadata.version)")

    do {
        if !usedCache {
            try script.write(toFile: scriptPath, atomically: true, encoding: .utf8)
        }
        try updateInfoPlist(at: infoPlistPath, with: metadata.excludePatterns)
    } catch {
        LogError("Failed to update files: \(error.localizedDescription)")
        return false
    }

    LogInfo("AdGuard Extra updated successfully")
    return true
}

// MARK: - Download

private func downloadScript(from url: URL) async throws -> String {
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = Constants.timeout

    let (data, _) = try await URLSession(configuration: config).data(from: url)

    guard let content = String(data: data, encoding: .utf8) else {
        throw AdGuardExtraError.invalidScriptEncoding
    }

    return content
}

// MARK: - URL Pattern Conversion

private func convertToSafariPatterns(_ patterns: [String]) -> [String] {
    var result: [String] = []

    for pattern in patterns {
        let cleaned = pattern.replacingOccurrences(of: "?", with: "")

        if cleaned.hasPrefix("*://") {
            let domain = cleaned.replacingOccurrences(of: "*://", with: "")
            result.append("http://\(domain)")
            result.append("https://\(domain)")
        } else if cleaned.contains("*") {
            var normalized = cleaned.replacingOccurrences(of: "*", with: "")
            if !normalized.hasSuffix("/*") {
                normalized += normalized.hasSuffix("/") ? "*" : "/*"
            }
            result.append("http://*.\(normalized)")
            result.append("https://*.\(normalized)")
        } else {
            result.append(cleaned)
        }
    }

    return result
}

// MARK: - Plist Updates

private func updateInfoPlist(at path: String, with patterns: [String]) throws {
    guard let plistData = FileManager.default.contents(atPath: path) else {
        throw AdGuardExtraError.cannotReadPlist(path: path)
    }

    guard var plist = try PropertyListSerialization
        .propertyList(from: plistData, options: [], format: nil) as? [String: Any] else {
        throw AdGuardExtraError.cannotParsePlist(path: path)
    }

    guard var nsExtension = plist["NSExtension"] as? [String: Any],
          var contentScripts = nsExtension["SFSafariContentScript"] as? [[String: Any]],
          let index = contentScripts.firstIndex(where: { ($0["Script"] as? String) == "adguard-extra-injector.js" })
    else {
        throw AdGuardExtraError.scriptEntryNotFound
    }

    contentScripts[index]["Excluded URL Patterns"] = convertToSafariPatterns(patterns)
    nsExtension["SFSafariContentScript"] = contentScripts
    plist["NSExtension"] = nsExtension

    let updatedData = try PropertyListSerialization.data(fromPropertyList: plist, format: .xml, options: 0)
    try updatedData.write(to: URL(fileURLWithPath: path))

    LogInfo("Updated Info.plist with \(patterns.count) patterns")
}
