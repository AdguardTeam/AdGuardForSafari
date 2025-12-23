// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AvailableServices.swift
//  BlockerExtension
//

import Foundation

protocol FiltersStorageDependent: ServiceDependent { var filtersStorage: FiltersStorage! { get set } }

protocol SharedSettingsStorageDependent: ServiceDependent {
    var sharedSettingsStorage: SharedSettingsStorage! { get set }
}
