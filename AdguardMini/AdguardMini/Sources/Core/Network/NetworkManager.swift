// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  NetworkManager.swift
//  AdguardMini
//

import Foundation

import AML
import AppBackend

// MARK: - Constants

private enum Constants {
    static var cacheDir: URL? {
        URL(string: NSTemporaryDirectory().appendingPathComponent("NetworkingCache"))
    }
    static var configuration: URLSessionConfiguration {
        let config = URLSessionConfiguration.default

        let cacheDir = Self.cacheDir
        LogDebug("URLSession cache directory: \(cacheDir?.debugDescription ?? "nil")")

        let cache = URLCache(
            memoryCapacity: 16_384,
            diskCapacity: 10_000_000,
            directory: cacheDir
        )

        config.urlCache = cache
        config.requestCachePolicy = .useProtocolCachePolicy

        return config
    }
}

// MARK: - Parameters

typealias Parameters = [String: String]

// MARK: - NetworkManagerProtocol

protocol NetworkManager: AnyObject {
    func data(request: Request) async throws -> Response
    func data(request: URLRequest) async throws -> Response
}

// MARK: - NetworkManager

final class NetworkManagerImpl: NetworkManager {
    // MARK: Private properties

    private let session = URLSession(configuration: Constants.configuration)

    // MARK: Public methods

    func data(request: Request) async throws -> Response {
        let urlRequest = request.toUrlRequest()
        return try await self.data(request: urlRequest)
    }

    func data(request: URLRequest) async throws -> Response {
        do {
            let (data, response) = try await self.session.data(for: request)

            var headers: [AnyHashable: Any] = [:]
            if let allHeaderFields = (response as? HTTPURLResponse)?.allHeaderFields {
                headers = allHeaderFields
            }
            return Response(code: response.getStatusCode(), data: data, headers: headers)
        } catch {
            LogError("Network request failed: \(error)")
            throw error
        }
    }
}
