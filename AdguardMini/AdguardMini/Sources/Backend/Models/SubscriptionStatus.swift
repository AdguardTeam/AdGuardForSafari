// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SubscriptionStatus.swift
//  AdguardMini
//

import Foundation

extension AppStatusInfo {
    @objc(AppStatusInfoSubscriptionStatusDetail)
    final class SubscriptionStatusDetail: NSObject, NSSecureCoding {
        static var supportsSecureCoding: Bool { true }

        /// Subscription status.
        let status: Status
        /// Subscription duration.
        let duration: Duration
        /// Next bill date.
        let nextBillDate: Date
        /// In-app payment system. Must be one of [GOOGLE_PLAY, APPLE_APP_STORE]
        let inAppPaymentSystem: InAppPaymentSystem?

        init(status: Status, duration: Duration, nextBillDate: Date, inAppPaymentSystem: InAppPaymentSystem?) {
            self.status = status
            self.duration = duration
            self.nextBillDate = nextBillDate
            self.inAppPaymentSystem = inAppPaymentSystem
        }

        // MARK: - NSSecureCoding Methods

        required init?(coder: NSCoder) {
            guard let statusRaw = coder.decodeObject(of: NSString.self, forKey: "status") as String?,
                  let status = Status(rawValue: statusRaw),
                  let durationRaw = coder.decodeObject(of: NSString.self, forKey: "duration") as String?,
                  let duration = Duration(rawValue: durationRaw),
                  let nextBillDate = coder.decodeObject(of: NSDate.self, forKey: "nextBillDate") as Date? else {
                return nil
            }
            self.status = status
            self.duration = duration
            self.nextBillDate = nextBillDate
            if let inAppPaymentSystemRaw = coder.decodeObject(
                of: NSString.self,
                forKey: "inAppPaymentSystem"
            ) as String? {
                self.inAppPaymentSystem = InAppPaymentSystem(rawValue: inAppPaymentSystemRaw)
            } else {
                self.inAppPaymentSystem = nil
            }
        }

        func encode(with coder: NSCoder) {
            coder.encode(status.rawValue, forKey: "status")
            coder.encode(duration.rawValue, forKey: "duration")
            coder.encode(nextBillDate, forKey: "nextBillDate")
        }
    }
}

extension AppStatusInfo.SubscriptionStatusDetail {
    override var description: String {
        """
        Status = \(self.status)
        Duration = \(self.duration)
        NextBillDate = \(self.nextBillDate)
        InAppPaymentSystem = \(self.inAppPaymentSystem.map { "\($0)" } ?? "absent")
        """
    }
}

extension AppStatusInfo.SubscriptionStatusDetail {
    /// Subscription duration.
    enum Duration: String {
        case monthly
        case yearly
    }

    /// Subscription status.
    enum Status: String {
        case active
        case pastDue
        case paused
        case deleted
    }

    /// In-app payment system.
    enum InAppPaymentSystem: String {
        case googlePlay
        case appleAppStore
        case other
    }
}
