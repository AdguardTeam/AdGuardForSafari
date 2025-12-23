// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  InternalUrlScheme.swift
//  AdguardMini
//

import Foundation

enum InternalUrlSchemeActionUrl {
    case restart
    case openSettings
    case subscribeFilter
}

extension InternalUrlSchemeActionUrl {
    enum SubscribeFilterParam {
        static let url: String = "url"
    }
}

extension InternalUrlSchemeActionUrl {
    private static func makeURL(endpoint: String) -> URL {
        URL(string: "\(Self.scheme):\(endpoint)")!
    }
    static let scheme = BuildConfig.AG_INTERNAL_URL_SCHEME

    var url: URL {
        switch self {
        case .restart:
            Self.makeURL(endpoint: "restart")
        case .openSettings:
            Self.makeURL(endpoint: "open_settings")
        case .subscribeFilter:
            Self.makeURL(endpoint: "subscribe_filter")
        }
    }

    var path: String {
        URLComponents(url: self.url, resolvingAgainstBaseURL: true)!.path
    }
}
