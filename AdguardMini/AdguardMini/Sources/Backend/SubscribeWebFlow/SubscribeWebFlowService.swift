// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SubscribeWebFlowService.swift
//  AdguardMini
//

import Foundation
import AppKit

import AML
import AppBackend

// MARK: - Constants

private enum Constants {
    static let redirectUrl = "\(MainUrlSchemeActionUrl.subscribeWebFlowRedirect.url)"
}

// MARK: - SubscribeWebFlowService

protocol SubscribeWebFlowService {
    func startPurchaseFlow(from screen: String) async throws
    func startRenewalFlow(licenseKey: String, from screen: String) async throws
}

// MARK: - SubscribeWebFlowServiceImpl

final class SubscribeWebFlowServiceImpl {
    private let productInfo: ProductInfoStorage

    init(productInfo: ProductInfoStorage) {
        self.productInfo = productInfo
    }
}

extension SubscribeWebFlowServiceImpl: SubscribeWebFlowService {
    func startPurchaseFlow(from screen: String) async throws {
        let appId = await self.productInfo.applicationId
        guard let url = SubscribeWebAPI.purchase(
            tds: .macMini(appid: appId, from: screen),
            appId: appId,
            appSlug: CommonBackendParameters.appSlug,
            returnUrl: Constants.redirectUrl
        ) else {
            throw SubscribeWebFlowServiceError.cantCreateUrl
        }
        NSWorkspace.shared.open(url)
    }

    func startRenewalFlow(licenseKey: String, from screen: String) async throws {
        let appId = await self.productInfo.applicationId
        guard let url = SubscribeWebAPI.renewal(
            tds: .macMini(appid: appId, from: screen),
            appId: appId,
            appSlug: CommonBackendParameters.appSlug,
            licenseKey: licenseKey,
            returnUrl: Constants.redirectUrl
        ) else {
            throw SubscribeWebFlowServiceError.cantCreateUrl
        }
        NSWorkspace.shared.open(url)
    }
}
