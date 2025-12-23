// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  AsyncSemaphore.swift
//  AdguardMini
//

import Foundation

/// Serial async lock for strict one-at-a-time execution without reentrancy
///
/// Unlike actor, which allows reentrancy at await points,
/// AsyncSerialLock guarantees that only one task executes at a time.
actor AsyncSerialLock {
    private var isLocked = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    /// Acquires the lock, suspending if already locked
    func lock() async {
        if self.isLocked {
            await withCheckedContinuation { continuation in
                self.waiters.append(continuation)
            }
        }
        self.isLocked = true
    }

    /// Releases the lock, resuming the next waiting task if any
    nonisolated func unlock() {
        Task {
            await self.unlockInternal()
        }
    }

    private func unlockInternal() {
        if let waiter = self.waiters.first {
            self.waiters.removeFirst()
            waiter.resume()
        } else {
            self.isLocked = false
        }
    }
}
