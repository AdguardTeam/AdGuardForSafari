// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserscriptParser.swift
//  AdguardMini
//

import Foundation

/// Errors that can occur during userscript parsing.
public enum UserscriptParsingError: Error {
    case missingMetadataBlock
    case missingRequiredField(String)
    case invalidRegexPattern
    case emptyScript
}

extension UserscriptParsingError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .missingMetadataBlock:
            return "Userscript metadata block (==UserScript==...==/UserScript==) not found"
        case .missingRequiredField(let field):
            return "Required field '@\(field)' is missing or empty"
        case .invalidRegexPattern:
            return "Internal error: Invalid regex pattern"
        case .emptyScript:
            return "Script content is empty"
        }
    }
}

/// Userscript metadata from ==UserScript== block.
public struct UserscriptMetadata {
    public let name: String
    public let version: String
    public let excludePatterns: [String]
    public let downloadURL: String?
    public let updateURL: String?

    public init(
        name: String,
        version: String,
        excludePatterns: [String] = [],
        downloadURL: String? = nil,
        updateURL: String? = nil
    ) {
        self.name = name
        self.version = version
        self.excludePatterns = excludePatterns
        self.downloadURL = downloadURL
        self.updateURL = updateURL
    }
}

/// Userscript metadata parser.
public enum UserscriptParser {
    private enum Constants {
        static let blockStart = "// ==UserScript=="
        static let blockEnd = "// ==/UserScript=="
        /// Regex pattern: // @tagName(:locale)? value
        ///
        /// Groups: (1) tagName, (2) optional locale, (3) value
        static let tagPattern = #"^//\s*@([\w\-]+)(?::([\w\-]+))?\s+(.+)$"#
    }

    private enum Tag: String {
        case name
        case version
        case downloadURL
        case updateURL
        case exclude
    }

    /// Parses metadata from userscript content.
    /// - Parameter script: Userscript file content.
    /// - Returns: Parsed metadata.
    /// - Throws: `UserscriptParsingError` if parsing fails.
    public static func parseMetadata(from script: String) throws -> UserscriptMetadata {
        guard !script.isEmpty else {
            throw UserscriptParsingError.emptyScript
        }

        guard let metadataBlock = extractMetadataBlock(from: script) else {
            throw UserscriptParsingError.missingMetadataBlock
        }

        let tags = try parseTagsWithRegex(from: metadataBlock)

        // Extract and validate required fields
        guard let name = tags["name"]?.first, !name.isEmpty else {
            throw UserscriptParsingError.missingRequiredField("name")
        }

        guard let version = tags["version"]?.first, !version.isEmpty else {
            throw UserscriptParsingError.missingRequiredField("version")
        }

        return UserscriptMetadata(
            name: name,
            version: version,
            excludePatterns: tags["exclude"] ?? [],
            downloadURL: tags["downloadURL"]?.first,
            updateURL: tags["updateURL"]?.first
        )
    }

    // MARK: - Private Methods

    /// Extracts metadata block from script using Substring for efficiency.
    /// - Parameter script: Full userscript content.
    /// - Returns: Metadata block substring or nil if not found.
    private static func extractMetadataBlock(from script: String) -> Substring? {
        guard let startRange = script.range(of: Constants.blockStart),
              let endRange = script.range(of: Constants.blockEnd, range: startRange.upperBound..<script.endIndex) else {
            return nil
        }

        // Use Substring to avoid copying - more efficient for large scripts
        return script[startRange.upperBound..<endRange.lowerBound]
    }

    /// Parses tags from metadata block using regex for robust parsing.
    /// - Parameter block: Metadata block substring.
    /// - Returns: Dictionary mapping tag names to their values (supports multiple values per tag).
    /// - Throws: `UserscriptParsingError.invalidRegexPattern` if regex compilation fails.
    private static func parseTagsWithRegex(from block: Substring) throws -> [String: [String]] {
        guard let regex = try? NSRegularExpression(pattern: Constants.tagPattern, options: []) else {
            throw UserscriptParsingError.invalidRegexPattern
        }

        var tags: [String: [String]] = [:]

        for line in block.split(separator: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)

            // Skip empty lines and non-comment lines
            guard !trimmed.isEmpty, trimmed.hasPrefix("//") else { continue }

            let nsString = trimmed as NSString
            let range = NSRange(location: 0, length: nsString.length)

            guard let match = regex.firstMatch(in: trimmed, range: range),
                  match.numberOfRanges >= 4 else { continue }

            // Extract tag name (group 1)
            let tagName = nsString.substring(with: match.range(at: 1))

            // Check for locale suffix (group 2) - skip localized tags
            let localeRange = match.range(at: 2)
            guard localeRange.location == NSNotFound else { continue }

            // Extract value (group 3) and trim whitespace
            let value = nsString.substring(with: match.range(at: 3))
                .trimmingCharacters(in: .whitespaces)

            guard !value.isEmpty else { continue }

            // Store value (supports multiple values for same tag, e.g., multiple @exclude)
            tags[tagName, default: []].append(value)
        }

        return tags
    }
}
