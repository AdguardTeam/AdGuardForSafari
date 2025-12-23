// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserDefaults.swift
//  AdguardMini Builder
//

import Foundation
import AML

/// Convert `Resources/Defaults.plist` file for usage in projects.
///
/// Reads plist and generates the following parts of `UserDefaults.swift`:
/// - Property Wrapper `UserDefault` to access stored values and provide default values (if set)
/// - All keys from plist as enum
/// - Extension `SettingsKey.asDict: [String: Any]` to set in a User Defaults domain (only keys with default values)
/// - Extension `SettingsKey.keysWithoutDefaultValues: [SettingsKey]`
/// - Protocol `UserSettingsProtocol` that describes all keys with default values
/// - Final class `UserSettings` that conforms `UserSettingsProtocol` by generation
/// - Returns: True, if proceeded.
func processUserDefaults() -> Bool {
    guard let plistPath = ProcessInfo.processInfo.environment["AGP_DEFAULTS_PLIST_PATH"] else {
        LogError("AGP_DEFAULTS_PLIST_PATH not set")
        return false
    }

    guard let plistData = FileManager.default.contents(atPath: plistPath) else {
        LogError("Can't read plist data")
        return false
    }
    do {
        guard var plist = try PropertyListSerialization
            .propertyList(
                from: plistData,
                options: .mutableContainersAndLeaves,
                format: nil
            ) as? [String: Any]
        else {
            LogError("Can't read plist")
            return false
        }
        plist = castToSwiftPrimitives(plist)
        let file = UserDefaultsBuilder.build(plist: plist)
        let resultFile = URL(filePath: ProcessInfo.processInfo.environment["AGP_GENERATED_USER_DEFAULTS_FILE"]!)
        do {
            try file.write(toFile: resultFile.path(), atomically: true, encoding: .utf8)
        } catch {
            LogError("Can't write file: \(error)")
            return false
        }
    } catch {
        LogError("Can't read plist")
        return false
    }
    return true
}

private func castToSwiftPrimitives(_ dict: [String: Any]) -> [String: Any] {
    var newDict: [String: Any] = [:]
    for (key, value) in dict {
        newDict[key] = eraseType(obj: value)
    }
    return newDict
}

/// Convert internal types to swift types.
/// - Parameter obj: Any object.
/// - Returns: Any object, casted to Swift type.
private func eraseType(obj: Any) -> Any {
    let value =
    if "\(type(of: obj))" == "__NSCFBoolean", let val = obj as? Bool {
        val
    } else if "\(type(of: obj))" == "__NSCFNumber", let val = obj as? Int {
        val
    } else if "\(type(of: obj))" == "__NSCFString", let val = obj as? String {
        val
    } else if let object = obj as? [Int] {
        object
    } else if let object = obj as? [String] {
        object
    } else {
        obj
    }
    return value as Any
}
