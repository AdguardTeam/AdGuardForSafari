// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ThirdPartyDependencies.swift
//  AdguardMini
//

import Foundation
import AML
import ContentBlockerConverter

private enum Constants {
    static let plistNameKey = "Name"
    static let plistVersionKey = "Version"
}

enum ThirdPartyDependencies {
    private static let thirdPartyDepsUrl = Bundle.main.url(
        forResource: "ThirdPartyDependencies",
        withExtension: "plist"
    )

    /// Third Party Dependencies in format [(name: String, version: String)].
    static var deps: [(name: String, version: String)] = {
        var array: [(String, String)] = []

        for dep in ThirdPartyDeps.allCases {
            let (name, version) = dep.dependency
            array.append((name, version))
        }

        array.append(("@adguard/extended-css", ContentBlockerConverterVersion.extendedCSS))
        array.append(("@adguard/scriptlets", ContentBlockerConverterVersion.scriptlets))
        array.append(("SafariConverterLib and @adguard/safari-extension", ContentBlockerConverterVersion.library))

        if let plistUrl = Self.thirdPartyDepsUrl,
           let plistData = FileManager.default.contents(atPath: plistUrl.path) {
            do {
                if let plist = try PropertyListSerialization
                    .propertyList(
                        from: plistData,
                        options: .mutableContainersAndLeaves,
                        format: nil
                    ) as? [String: [String: String]] {
                    for info in plist.values {
                        guard let name = info[Constants.plistNameKey],
                              let version = info[Constants.plistVersionKey]
                        else {
                            continue
                        }
                        array.append((name, version))
                    }
                }
            } catch {
                LogError("Can't read ThirdPartyDependencies plist: \(error)")
            }
        }

        array.sort { $0.0 < $1.0 }

        return array
    }()
}
