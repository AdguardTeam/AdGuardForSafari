// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  BackendError.swift
//  AdguardMini
//

enum BackendError: Error {
    case badHttpCode(Int)
    case wrongXRequestKey
}
