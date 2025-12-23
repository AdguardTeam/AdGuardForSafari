// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  MainUrlScheme.swift
//  AdguardMini
//

import Foundation

enum MainUrlSchemeActionUrl {
    case webFlowRedirect
    case subscribeWebFlowRedirect
}

extension MainUrlSchemeActionUrl {
    static let scheme: String = BuildConfig.AG_URL_ADGUARD_MINI_SCHEME

    var url: URL {
        switch self {
        case .webFlowRedirect:
            self.makeUrl(host: "webflow")
        case .subscribeWebFlowRedirect:
            self.makeUrl(host: "subscription")
        }
    }

    var host: String {
        self.url.host!
    }

    private func makeUrl(host: String) -> URL {
        URL(string: "\(Self.scheme)://\(host)")!
    }
}
