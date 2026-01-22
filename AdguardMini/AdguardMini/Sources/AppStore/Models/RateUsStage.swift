// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  RateUsStage.swift
//  AdguardMini
//

import Foundation

enum RateUsStage: Int {
    case first
    case second
    case third

    var interval: TimeInterval {
        switch self {
        case .first:
            self.getDevConfigVal(forKey: .rateUsFirstDuration, or: 72.hours)
        case .second:
            self.getDevConfigVal(forKey: .rateUsSecondDuration, or: 30.days)
        case .third:
            self.getDevConfigVal(forKey: .rateUsThirdDuration, or: 90.days)
        }
    }

    var next: RateUsStage {
        switch self {
        case .first:  .second
        case .second: .third
        case .third:  .first
        }
    }

    private func getDevConfigVal(
        forKey key: DeveloperConfigUtils.Property,
        or defaultValue: TimeInterval
    ) -> TimeInterval {
        if let seconds = DeveloperConfigUtils[key] as? Int {
            return TimeInterval(seconds)
        }
        return defaultValue
    }
}
