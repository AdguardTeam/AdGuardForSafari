// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PromotionResponse+Utils.swift
//  AdguardMini
//

import Foundation
import AppBackend

extension AppBackend.PromotionResponse {
    var isActual: Bool {
        let now = Date.now
        let isActualDate = now >= self.startDate && now < self.endDate
        return self.active && isActualDate
    }
}
