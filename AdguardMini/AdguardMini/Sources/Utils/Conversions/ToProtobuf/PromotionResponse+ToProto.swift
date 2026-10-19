// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PromotionResponse+ToProto.swift
//  AdguardMini
//

import AppBackend
import ProtoSchema

extension AppBackend.PromotionResponse {
    /// Maps the promotion to its Protobuf message, or `nil` when the promotion is not actual.
    func toProto() -> ProtoSchema.PromoInfo? {
        guard self.isActual else {
            return nil
        }

        return ProtoSchema.PromoInfo(
            title: self.title,
            subtitle: self.label,
            buttonText: self.buttonText,
            buttonUrl: self.buttonUrl
        )
    }
}
