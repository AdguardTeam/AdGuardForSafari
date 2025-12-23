// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Response+Utils.swift
//  AdguardMini
//

import AML
import AppBackend

extension Response {
    func check(of request: BackendRequest? = nil, action: String) throws {
        guard self.code / 100 == 2 else {
            LogError("Http Error when \(action). Http Status: \(self.code). Body: \(String(decoding: self.data, as: Unicode.UTF8.self))")
            LogErrorTrace()
            throw BackendError.badHttpCode(self.code)
        }

        guard request?.checkResponse(self) ?? true else {
            LogError("Error \(action): Wrong X-Request-Key from server")
            LogErrorTrace()
            throw BackendError.wrongXRequestKey
        }
    }
}
