// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExchangeSettingsItemModel.swift
//  Adguard
//

// swiftlint:disable identifier_name

import Foundation
import AML

private enum Constants {
    static let dateFormatter: DateFormatter = {
        let format = DateFormatter()
        format.locale = Locale(identifier: "en_US_POSIX")
        format.dateFormat = "yyyyMMddHHmmss"
        format.timeZone = TimeZone(secondsFromGMT: 0)
        return format
    }()
}

// MARK: DECLARATION -

// MARK: ExchangeSettings Interface

/// Exchanging settings mechanism definitions.
enum ExchangeSettings {
    // MARK: JSON keys

    static let ManifestCodableKey = "manifest"
    static let PayloadCodableKey = "payload"

    // MARK: Subfolder names (for exporting)

    static let appIconsSubfolderName = "appIcons"
    static let blockingFiltersSubfolderName = "blockingFilters"
    static let dnsFiltersSubfolderName = "dnsFilters"
    static let dnsFilterContentSubfolderName = "content"
    static let userscriptsSubfolderName = "userscripts"

    // MARK: File types (for exporting and processing)

    static let jsonExtension = "json"
    static let iconExtension = "icns"
    static let pngExtension  = "png"
    static let dnsFilterBodyExtension = "txt"

    // MARK: JSON Encoder/Decoder common settings

    static let dataEncodingStrategy = JSONEncoder.DataEncodingStrategy.base64
    static let dateEncodingStrategy = JSONEncoder.DateEncodingStrategy.secondsSince1970
    static let dateEncodingOutFormat: JSONEncoder.OutputFormatting = [.prettyPrinted]

    // MARK: Others definition

    /// Generates AdGuard Mini settings file name for current time.
    static var settingsFileName: String {
        let appName = BuildConfig.AG_APP_DISPLAYED_NAME
        let fileExt = BuildConfig.AG_EXCHANGE_SETTINGS_FILE_EXTENSION
        return "\(appName)_\(Constants.dateFormatter.string(from: Date())).\(fileExt)"
    }
}

// MARK: ExchangeSettings for Sharing Url Definitions
extension ExchangeSettings {
    // MARK: Query value parsing constants for Sharing URL mechanism

    static let joinDelimiter: Character = ","
    static let joinRegularFiltersDelimiter: Character = "."
    static let reportCustomFilterFormat = "%@ (url: %@)"
    static let reportCustomFilterFormatRegexp = #"^.* \(url\: (.+)\)$"#
    static let reportUserscriptFormat = "%@ (%@; url: %@)"
    static let reportUserscriptFormatRegexp = #"^.* \(.+; url\: (.+)\)$"#
    static let excludeDnsFiltersNames = ["DnsUserRules", "User rules"]
    static let excludeDnsServersNames = ["System"]
    static let joinQueryParam: Character = "."
    /// Name of the `UrlQueryParam` enum case for reference to itself.
    /// A reference to itself, for the case when it is necessary to describe a parameter that has both:
    /// nested values, and the value of the parameter itself.
    /// For example, for Extensions the parameters is: extensions, extensions.enabled
    static let selfParam = "this"
    static let emptyValue = "none"
    static let baseVersion = "1"

    // MARK: UrlQueryParam

    enum UrlQueryParam: String {
        static let version = "1"

        case
        scheme_version,
        system_version,
        adblocking,
        filters,
        custom_filters

        // MARK: Adblocking section (Used only for export into `Support`)
        enum Adblocking: String {
            case
            enabled
        }
    }
}

// swiftlint:enable identifier_name
