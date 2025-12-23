// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  WebSession.swift
//  AdguardMini
//

import Foundation
import AuthenticationServices

// MARK: - WebAuthServiceError

enum WebAuthServiceError: Error, CustomStringConvertible {
    case alreadyStarted
    case cantStart
    case invalidResult
    case other(Error)

    var description: String {
        switch self {
        case .alreadyStarted:
            "Session already started"
        case .cantStart:
            "Can't start session for some reason"
        case .invalidResult:
            "No callback url and no error in the handler"
        case .other(let error):
            "Other error: \(error)"
        }
    }
}

// MARK: - WebSession

protocol WebSession {
    var canStart: Bool { get }

    /// Start web session with url.
    /// - Parameters:
    ///   - url: URL for open.
    ///   - callbackURLScheme: Scheme for the callback that the session will expect.
    ///   - timeout: Timeout for cancel session.
    ///   - completionHandler: Result handler.
    func start(
        url: URL,
        callbackURLScheme: String,
        timeout: TimeInterval?,
        completionHandler: @escaping (Result<URL, WebAuthServiceError>) -> Void
    ) throws
    func cancel()
}

// MARK: - WebSessionImpl

final class WebSessionImpl: WebSession {
    private let presentationContextProvider: ASWebAuthenticationPresentationContextProviding

    private var webAuthSession: ASWebAuthenticationSession?
    private var timer: Timer?

    var canStart: Bool {
        self.webAuthSession?.canStart ?? true
    }

    init(presentationContextProvider: ASWebAuthenticationPresentationContextProviding = PresentationContextProvider()) {
        self.presentationContextProvider = presentationContextProvider
    }

    func start(
        url: URL,
        callbackURLScheme: String,
        timeout: TimeInterval? = nil,
        completionHandler: @escaping (Result<URL, WebAuthServiceError>) -> Void
    ) throws {
        guard self.webAuthSession?.canStart ?? true else {
            throw WebAuthServiceError.alreadyStarted
        }
        self.webAuthSession = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: callbackURLScheme
        ) { [weak self] url, error in
            self?.webAuthSession = nil
            if let error {
                completionHandler(.failure(.other(error)))
            } else if let url {
                completionHandler(.success(url))
            } else {
                completionHandler(.failure(WebAuthServiceError.invalidResult))
            }
            self?.cancelTimer()
        }
        self.webAuthSession?.presentationContextProvider = self.presentationContextProvider
        if !(self.webAuthSession?.start() ?? false) {
            self.webAuthSession = nil
            throw WebAuthServiceError.cantStart
        }
        self.cancelTimer()
        if let timeout {
            self.timer = Timer.scheduledTimer(withTimeInterval: timeout, repeats: false) { [weak self] timer in
                self?.cancel()
                timer.invalidate()
            }
        }
    }

    func cancel() {
        self.cancelTimer()
        self.webAuthSession?.cancel()
        self.webAuthSession = nil
    }

    private func cancelTimer() {
        self.timer?.invalidate()
        self.timer = nil
    }
}

// MARK: - PresentationContextProvider

final class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        NSApplication.shared.keyWindow ?? NSApplication.shared.mainWindow ?? ASPresentationAnchor()
    }
}
