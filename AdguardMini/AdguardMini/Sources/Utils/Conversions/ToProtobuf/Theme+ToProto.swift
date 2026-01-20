// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Theme+ToProto.swift
//  AdguardMini
//

import SciterSchema

extension Theme {
    func toProto() -> SciterSchema.Theme {
        switch self {
        case .system: .system
        case .light:  .light
        case .dark:   .dark
        }
    }
}
