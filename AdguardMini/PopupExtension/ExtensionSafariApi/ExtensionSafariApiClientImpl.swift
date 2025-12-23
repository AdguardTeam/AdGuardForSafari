// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  ExtensionSafariApiClientImpl.swift
//  PopupExtension
//

import Foundation
import AML
import XPCGateLib

// MARK: - ExtensionSafariApiClientManager

protocol ExtensionSafariApiClientManager: SafariPopupApi, MainAppApi {
    /// Convenience method to wait for the remote XPC service is ready to accept requests
    @inlinable
    func waitForApi(timeout: TimeInterval, block: @escaping (_ error: ExtensionSafariApiClientErrorCode?) -> Void)
    @inlinable
    func withSafariApi(
        timeout: TimeInterval,
        else failHandler: @escaping () -> Void,
        block: @escaping (_ api: MainAppApi) -> Void
    )
}

// MARK: - ExtensionSafariApiClientImpl

final class ExtensionSafariApiClientImpl {
    // MARK: Public properties

    weak var delegate: ExtensionSafariApiClientDelegate?

    // MARK: Private properties

    private let workQueue: DispatchQueue
    private var gateClient: XPCGateClient!

    // MARK: - Init

    init() {
        self.workQueue = DispatchQueue(
            label: "SafariPopupApi.queue.\(UUID().uuidString)",
            autoreleaseFrequency: .workItem
        )
        self.gateClient = XPCGateClient(gate: BuildConfig.AG_HELPER_ID,
                                        privileged: false,
                                        protocolID: ExtensionSafariApiProtocolId,
                                        delegate: self)
    }

    deinit {
        self.gateClient.disconnect()
    }

    // MARK: Private methods

    private func withSafariApi(timeout: TimeInterval,
                               start: Date?,
                               else failHandler: @escaping () -> Void,
                               block: @escaping (_ api: MainAppApi) -> Void) {
        var delay = 0.0

        /* In recursive call (when the start argument is not zero),
         return an error if the timeout has expired,
         otherwise set the delay to receive the remote proxy for 1 sec.
         */
        if let start {
            let timeElapsed = Date().timeIntervalSince(start)
            if timeElapsed < timeout {
                LogDebug("Retry in 1 sec")
                delay = 1.0
            } else {
                self.workQueue.async {
                    LogError("Link Timeout")
                    failHandler()
                }
                return
            }
        }

        self.workQueue.asyncAfter(deadline: .now() + delay) {
            let remoteProxy = self.gateClient.ensureRemoteProxy()
            let proxy = remoteProxy?.remoteObjectProxyWithErrorHandler {
                LogError("Browser API proxy error: \($0)")
                failHandler()
            }

            if let api = proxy as? MainAppApi {
                block(api)
                return
            }

            LogError("Nil API proxy for MainAppApi")
            self.withSafariApi(timeout: timeout,
                               start: start ?? Date(),
                               else: failHandler,
                               block: block)
        }
    }
}

// MARK: - ExtensionSafariApiClientManager implementation

extension ExtensionSafariApiClientImpl: ExtensionSafariApiClientManager {
    /// Convenience method to wait for the remote XPC service is ready to accept requests
    @inlinable
    func waitForApi(timeout: TimeInterval, block: @escaping (_ error: ExtensionSafariApiClientErrorCode?) -> Void) {
        self.withSafariApi(timeout: timeout, else: { block(.linkTimeout) }) { _ in
            block(nil)
        }
    }

    @inlinable
    func withSafariApi(timeout: TimeInterval = 0,
                       else failHandler: @escaping () -> Void,
                       block: @escaping (_ api: MainAppApi) -> Void) {
        self.withSafariApi(timeout: timeout, start: nil, else: failHandler, block: block)
    }
}
