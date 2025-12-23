// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WebFlowService.swift
//  AdguardMini
//

import Foundation
import AppKit

import AML
import AppBackend

// MARK: - Constants

private enum Constants {
    #if !MAS
    static let appType = WebAPI.AppType.standalone
    #else
    static let appType = WebAPI.AppType.store
    #endif

    static let redirectUrl = "\(MainUrlSchemeActionUrl.webFlowRedirect.url)"

    static let webSessionTimeout: TimeInterval = 30.minutes

    static let webSessionErrorDomain = "com.apple.AuthenticationServices.WebAuthenticationSession"
    static let webSessionErrorCancelledCode = 1

    static let checkIfUserRedirectedToPurchase: (URLQueryItem) -> Bool = {
        $0.name == "result" && $0.value == "userRedirectedToPurchase"
    }
}

// MARK: - WebFlowService

protocol WebFlowService {
    func activate(from screen: String) async throws -> WebActivateResult
    func activateTrial(from screen: String) async throws -> WebActivateResult
    func bindLicense(licenseKey: String, from screen: String) async throws -> WebActivateResult
    func cancelWebSession()
}

// MARK: - WebFlowServiceImpl

final class WebFlowServiceImpl {
    private let productInfo: ProductInfoStorage
    private let webSession: WebSession

    private let presentationContextProvider = PresentationContextProvider()

    init(productInfo: ProductInfoStorage, webSession: WebSession = WebSessionImpl()) {
        self.productInfo = productInfo
        self.webSession = webSession
    }

    @MainActor
    private func startWebSession(url: URL) async throws -> URLComponents {
        try await withCheckedThrowingContinuation { continuation in
            do {
                try self.webSession.start(
                    url: url,
                    callbackURLScheme: BuildConfig.AG_URL_ADGUARD_MINI_SCHEME,
                    timeout: Constants.webSessionTimeout
                ) { result in
                    switch result {
                    case .success(let callbackUrl):
                        if let components = URLComponents(url: callbackUrl, resolvingAgainstBaseURL: true) {
                            continuation.resume(returning: components)
                        } else {
                            LogError("Can't parse url: \(callbackUrl)")
                            continuation.resume(throwing: WebFlowServiceError.cantParseCallbackUrl)
                        }
                    case .failure(let error):
                        continuation.resume(throwing: error)
                    }
                }
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    private func processWebSession(url: URL) async throws -> WebActivateResult {
        do {
            let callbackComponents = try await self.startWebSession(url: url)
            if (callbackComponents.queryItems?.contains(where: Constants.checkIfUserRedirectedToPurchase)) ?? false {
                LogInfo("User redirected to purchase")
                return .userRedirectedToPurchase
            }
            return .success
        } catch WebAuthServiceError.other(let error as NSError) {
            if error.domain == Constants.webSessionErrorDomain,
               error.code == Constants.webSessionErrorCancelledCode {
                return .cancelled
            }
            throw WebAuthServiceError.other(error)
        } catch {
            throw error
        }
    }
}

extension WebFlowServiceImpl: WebFlowService {
    func activate(from screen: String) async throws -> WebActivateResult {
        let appId = await self.productInfo.applicationId
        guard let url = WebAPI.activate(
            tds: .macMini(appid: appId, from: screen),
            appId: appId,
            appSlug: CommonBackendParameters.appSlug,
            appType: Constants.appType,
            returnUrl: Constants.redirectUrl
        )
        else {
            throw WebFlowServiceError.cantCreateUrl
        }

        return try await self.processWebSession(url: url)
    }

    func activateTrial(from screen: String) async throws -> WebActivateResult {
        let appId = await self.productInfo.applicationId
        guard let url = WebAPI.trial(
            tds: .macMini(appid: appId, from: screen),
            appId: appId,
            appSlug: CommonBackendParameters.appSlug,
            appType: Constants.appType,
            returnUrl: Constants.redirectUrl
        ) else {
            throw WebFlowServiceError.cantCreateUrl
        }

        return try await self.processWebSession(url: url)
    }

    func bindLicense(licenseKey: String, from screen: String) async throws -> WebActivateResult {
        let appId = await self.productInfo.applicationId
        guard let url = WebAPI.bind(
            tds: .macMini(appid: appId, from: screen),
            licenseKey: licenseKey,
            appId: appId,
            appSlug: CommonBackendParameters.appSlug,
            appType: Constants.appType,
            returnUrl: Constants.redirectUrl
        ) else {
            throw WebFlowServiceError.cantCreateUrl
        }

        return try await self.processWebSession(url: url)
    }

    func cancelWebSession() {
        self.webSession.cancel()
    }
}
