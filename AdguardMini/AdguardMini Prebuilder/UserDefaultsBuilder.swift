// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserDefaultsBuilder.swift
//  AdguardMini Builder
//

import Foundation

private enum Constants {
    static let keyOnlyMark = "__KEY_ONLY"
    static let stringTypeProviderMark = "__TYPE_PROVIDER"
}

enum UserDefaultsBuilder {
    private static let enumName = "SettingsKey"
    private static let propertyWrapperName = "UserDefault"

    static func build(plist: [String: Any]) -> String {
        let cases = plist.keys.map { "    case \($0)" }.joined(separator: "\n")

        return """
            import Foundation

            \(Self.buildPropertyWrapper())

            enum \(Self.enumName): String, CaseIterable {
            \(cases)
            }

            \(Self.buildAsDictExtension(plist))

            \(Self.buildNotPredefinedKeysExtension(plist))

            \(Self.buildUserSettings(plist))
            """
    }

    private static func buildPropertyWrapper() -> String {
        """
        @propertyWrapper
        struct \(Self.propertyWrapperName)<Value> {
            let key: \(Self.enumName)
            let defaultValue: Value
            var container: UserDefaults = .standard

            var wrappedValue: Value {
                get {
                    self.container.object(forKey: key.rawValue) as? Value ?? defaultValue
                }
                set {
                    let anyValue = newValue as Any

                    if case Optional<Any>.none = anyValue {
                        container.removeObject(forKey: key.rawValue)
                    } else {
                        self.container.set(newValue, forKey: key.rawValue)
                    }
                }
            }
        }

        extension UserDefault where Value: ExpressibleByNilLiteral {
            init(_ key: SettingsKey, container: UserDefaults = .standard) {
                self.init(key: key, defaultValue: nil, container: container)
            }
        }
        """
    }

    private static func buildUserSettings(_ plist: [String: Any]) -> String {
        let protocolVars = plist
            .filter { $0.value as? String != Constants.keyOnlyMark }
            .map { "    var \($0.key): \(type(of: $0.value)) { get set }" }
            .joined(separator: "\n")

        let userDefaultsVars = plist
            .filter { $0.value as? String != Constants.keyOnlyMark }
            .map {
                """
                    @\(Self.propertyWrapperName)(key: .\($0.key), defaultValue: \(removeServiceData($0.value)))
                    var \($0.key): \(type(of: $0.value))
                """
            }
            .joined(separator: "\n")

        return """
            // MARK: - UserSettingsProtocol

            protocol UserSettingsProtocol: AnyObject {
            \(protocolVars)
            }

            // MARK: - UserSettings

            final class UserSettings {
            \(userDefaultsVars)
            }
            """
    }

    private static func buildAsDictExtension(_ plist: [String: Any]) -> String {
        let dictEntries = plist
            .filter { $0.value as? String != Constants.keyOnlyMark }
            .map { "                \"\($0.key)\": \(removeServiceData($0.value))," }
            .joined(separator: "\n")

        return """
            extension \(Self.enumName) {
                static var asDict: [String: Any] {
                    [
            \(dictEntries)
                    ]
                }
            }
            """
    }

    private static func buildNotPredefinedKeysExtension(_ plist: [String: Any]) -> String {
        let keys = plist
            .filter { $0.value as? String == Constants.keyOnlyMark }
            .map { "                .\($0.key)," }
            .joined(separator: "\n")

        return """
            extension \(Self.enumName) {
                static var keysWithoutDefaultValues: [\(Self.enumName)] {
                    [
            \(keys)
                    ]
                }
            }
            """
    }

    private static func removeServiceData(_ value: Any) -> Any {
        if let arr = value as? [String] {
            return arr.filter { $0 != Constants.stringTypeProviderMark }
        }
        return value
    }
}
