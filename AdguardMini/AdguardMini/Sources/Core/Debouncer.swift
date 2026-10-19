// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  Debouncer.swift
//  AdguardMini
//

import Foundation

final actor Debouncer {
    private var debounceTask: Task<Void, Never>?

    private let debounceTimeSeconds: TimeInterval

    init(debounceTimeSeconds: TimeInterval) {
        self.debounceTimeSeconds = debounceTimeSeconds
    }

    func debounce(_ completion: @escaping () async -> Void, onCancel: @escaping @Sendable () -> Void = {}) {
        self.debounceTask?.cancel()

        // `nonisolated(unsafe)` because the completion runs once, in this task.
        nonisolated(unsafe) let job = completion
        self.debounceTask = Task.detached {
            try? await withTaskCancellationHandler(
                operation: {
                    try await Task.sleep(seconds: self.debounceTimeSeconds)
                    await job()
                },
                onCancel: onCancel
            )
        }
    }
}
