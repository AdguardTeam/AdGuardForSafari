// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  EdgeInsets+Utils.swift
//  AGSEDesignSystem
//

import SwiftUI

extension EdgeInsets {
    @inlinable
    init(vertical: CGFloat, horizontal: CGFloat) {
        self.init(top: vertical, leading: horizontal, bottom: vertical, trailing: horizontal)
    }

    @inlinable
    init(side: CGFloat) {
        self.init(top: side, leading: side, bottom: side, trailing: side)
    }
}
