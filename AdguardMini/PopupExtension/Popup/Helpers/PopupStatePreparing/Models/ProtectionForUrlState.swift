// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ProtectionForUrlState.swift
//  PopupExtension
//

import Foundation

/// The protection status for the current page. The currentUrl can be nшll if the current page is a system page.
struct ProtectionForUrlState {
    let currentUrl: URL?
    let isProtectionEnabledForCurrentUrl: Bool
}
