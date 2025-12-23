// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LoginItemService.swift
//  AdguardMini
//

import Foundation
import Combine
import AML

// MARK: - Constants

private enum Constants {
    /// 2 seconds
    static let checkInterval: TimeInterval = 2
}

// MARK: - LoginItemServiceDelegate

protocol LoginItemServiceDelegate: AnyObject {
    func registrationSuccessful()
}

// MARK: - LoginItemService

protocol LoginItemService: AnyObject {
    var delegate: LoginItemServiceDelegate? { get set }

    func tryRegisterHelper() -> Bool
}

// MARK: - LoginItemServiceImpl

final class LoginItemServiceImpl: LoginItemService {
    // MARK: - Private properties

    private let manager: LoginItemManager

    private var cancellable: Cancellable?

    // MARK: - Public properties

    weak var delegate: LoginItemServiceDelegate?

    // MARK: - Init

    init(manager: LoginItemManager) {
        self.manager = manager
    }

    // MARK: Public properties

    func tryRegisterHelper() -> Bool {
        var result: Bool
        switch self.manager.checkAndRegisterHelper() {
        case .requiresApproval:
            self.setupRetryTimer()
            result = false
        default:
            result = true
        }
        return result
    }

    // MARK: Private properties

    private func loopTryRegisterHelper() {
        switch self.manager.checkAndRegisterHelper() {
        case .requiresApproval:
            break
        default:
            self.cancellable = nil
            self.delegate?.registrationSuccessful()
        }
    }

    private func setupRetryTimer() {
        guard self.cancellable == nil else { return }
        LogInfo("Setup timer to check the availability of LoginItem")
        self.cancellable = Timer
            .publish(every: Constants.checkInterval, on: .main, in: .default)
            .autoconnect()
            .sink { [weak self] _ in
                self?.loopTryRegisterHelper()
            }
    }
}
