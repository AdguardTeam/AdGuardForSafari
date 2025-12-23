// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AdvancedBlocking+Utils.swift
//  AdguardMini
//

import Foundation
import SciterSchema

extension SciterSchema.AdvancedBlocking {
    func toDTO() -> AdvancedBlockingDTO {
        AdvancedBlockingDTO(
            advancedRules: self.advancedRules,
            adguardExtra: self.adguardExtra
        )
    }
}
