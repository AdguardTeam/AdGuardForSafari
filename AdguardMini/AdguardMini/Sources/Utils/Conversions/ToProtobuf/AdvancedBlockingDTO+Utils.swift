// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AdvancedBlockingDTO+Utils.swift
//  AdguardMini
//

import Foundation
import SciterSchema

extension AdvancedBlockingDTO {
    func toProto() -> AdvancedBlocking {
        AdvancedBlocking(
            advancedRules: self.advancedRules,
            adguardExtra: self.adguardExtra
        )
    }
}
