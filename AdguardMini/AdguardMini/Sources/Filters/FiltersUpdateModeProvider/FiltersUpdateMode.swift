// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersUpdateMode.swift
//  AdguardMini
//

private enum Constants {
    static let diffPeriod: TimeInterval = 1.hour
    static let fullPeriod: TimeInterval = 1.day
}

import Foundation

/// Describes marketing-level filters update modes and their technical schedule.
///
/// - `base`: the standard ("Base") mode — updates performed daily.
/// - `realtime`: the "Real-time" mode — updates performed hourly.
/// - `disabled`: automatic updates are turned off.
enum FiltersUpdateMode {
    case base
    case realtime
    case disabled

    /// Computes effective mode from user settings and license state.
    /// - Parameters:
    ///   - realTime: Whether the user enabled real-time updates in settings.
    ///   - auto: Whether automatic updates are enabled at all.
    ///   - licenseActive: Whether a paid license is active (required for real-time).
    /// - Returns: `disabled` if auto is off; `realtime` if paid license and real-time is on; otherwise `base`.
    static func compute(realTime: Bool, auto: Bool, licenseActive: Bool) -> Self {
        if !auto { return .disabled }
        if !licenseActive { return .base }
        return realTime ? .realtime : .base
    }

    /// Update intervals for each mode.
    /// 
    /// - `realtime`: frequent diff updates, daily full updates
    /// - `base`: no diff updates, daily full updates  
    /// - `disabled`: no updates
    var intervals: Intervals {
        switch self {
        case .base:
            Intervals(diffPeriod: .infinity, fullPeriod: Constants.fullPeriod)
        case .realtime:
            Intervals(diffPeriod: Constants.diffPeriod, fullPeriod: Constants.fullPeriod)
        case .disabled:
            Intervals(diffPeriod: .infinity, fullPeriod: .infinity)
        }
    }

    struct Intervals {
        let diffPeriod: TimeInterval
        let fullPeriod: TimeInterval
    }
}
