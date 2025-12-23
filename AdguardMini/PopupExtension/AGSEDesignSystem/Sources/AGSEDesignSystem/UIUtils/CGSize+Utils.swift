// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  CGSize+Utils.swift
//  AGSEDesignSystem
//

import Foundation

extension CGSize {
    @inlinable
    init(side: CGFloat) {
        self.init(width: side, height: side)
    }
}
