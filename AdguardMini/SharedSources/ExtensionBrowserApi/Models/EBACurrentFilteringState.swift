// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EBACurrentFilteringState.swift
//  AdguardMini
//

import Foundation

/// Class used as response in `getCurrentFilteringState` API method
@objc(EBACurrentFilteringState)
final class EBACurrentFilteringState: NSObject, NSSecureCoding {
    @objc dynamic var isFilteringEnabled: Bool = false

    @objc static let supportsSecureCoding: Bool = true

    @objc override init() { }

    @objc func encode(with coder: NSCoder) {
        coder.encode(self.isFilteringEnabled, forKey: "isFilteringEnabled")
    }

    @objc required init?(coder: NSCoder) {
        self.isFilteringEnabled = coder.decodeBool(forKey: "isFilteringEnabled")
    }

    @objc var asDictionary: [String: Any] {
        [
            "isFilteringEnabled": self.isFilteringEnabled
        ]
    }

    @objc override var description: String {
        "[\(debug: self) isFilteringEnabled: \(self.isFilteringEnabled)]"
    }
}
