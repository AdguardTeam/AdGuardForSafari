// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesOrError+Utils.swift
//  ProtoSchema
//

extension UserRulesOrError {
    /// Wraps the given user rules into a successful import reply.
    public init(userRules: UserRules) {
        self.init()
        self.userRules = userRules
    }

    /// A reply reporting that the user-rules import failed.
    public static var importError: UserRulesOrError {
        var val = UserRulesOrError()
        val.error = true
        return val
    }
}
