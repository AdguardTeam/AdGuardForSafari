// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EBAppState.swift
//  AdguardMini
//

import Foundation
import AML

/// Class used as response in `appState` API method
@objc(EBAAppState)
final class EBAAppState: NSObject, NSSecureCoding {
    @objc dynamic var isProtectionEnabled: Bool = false
    @objc dynamic var lastCheckTime: EBATimestamp = currentTimestamp()
    @objc dynamic var logLevel: Int32 = Int32(Logger.shared.logLevel.rawValue)

    @objc static let supportsSecureCoding: Bool = true

    @objc static func currentTimestamp() -> EBATimestamp {
        Date().timeIntervalSinceReferenceDate
    }

    @objc static var zeroTimestampString = Date(timeIntervalSinceReferenceDate: EBATimestamp.zero).iso8601String

    @objc static func timestampString(_ timestamp: EBATimestamp) -> String {
        timestamp == EBATimestamp.zero
        ? Self.zeroTimestampString
        : Date(timeIntervalSinceReferenceDate: timestamp).iso8601String
    }

    @objc static func currentTimestampString() -> String {
        self.timestampString(self.currentTimestamp())
    }

    @objc override init() { }

    @objc func encode(with coder: NSCoder) {
        coder.encode(self.isProtectionEnabled, forKey: "isProtectionEnabled")
        coder.encode(self.lastCheckTime, forKey: "lastCheckTime")
        coder.encode(self.logLevel, forKey: "logLevel")
    }

    @objc required init?(coder: NSCoder) {
        self.isProtectionEnabled = coder.decodeBool(forKey: "isProtectionEnabled")
        self.lastCheckTime = coder.decodeDouble(forKey: "lastCheckTime")
        self.logLevel = coder.decodeInt32(forKey: "logLevel")
    }

    @objc var lastCheckTimeString: String {
        Self.timestampString(self.lastCheckTime)
    }

    override var description: String {
        "<\(type(of: self)): \(Unmanaged.passUnretained(self).toOpaque())> isProtectionEnabled: \(self.isProtectionEnabled), lastCheckTime: \(self.lastCheckTimeString), logLevel: \(self.logLevel)"
    }
}

// MARK: Date + iso8601String

fileprivate extension Date {
    var iso8601String: String {
        let formatter = ISO8601DateFormatter()
        return formatter.string(from: self)
    }
}
