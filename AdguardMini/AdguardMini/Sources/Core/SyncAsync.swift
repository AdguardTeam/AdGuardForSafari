// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SyncAsync.swift
//  AdguardMini
//

import Foundation

/// Special class designed for the sequential execution of asynchronous tasks
final class SyncAsync {
    private let queue: DispatchQueue

    init(name: String) {
        self.queue = DispatchQueue(label: name)
    }

    /// Submit the job to the queue and return control (asynchronously)
    func async(_ block: @escaping () async -> Void) {
        // `nonisolated(unsafe)` because the block runs exactly once, on `queue`.
        nonisolated(unsafe) let job = block
        self.queue.async {
            SerialJob.run {
                await job()
            }
        }
    }

    /// Submit the job in the queue and waiting for its execution
    func sync<Out>(_ block: @escaping () async -> Out) -> Out {
        self.queue.sync {
            SerialJob.run {
                await block()
            }
        }
    }

    /// Submit the job in the queue and asynchronously waiting for its execution.
    func serialAsync<Out>(_ block: @escaping () async -> Out) async -> Out {
        self.sync(block)
    }

    /// Submit the job in the queue and waiting for its execution.
    func sync<Out>(_ block: @escaping () async throws -> Out) throws -> Out {
        try self.queue.sync {
            try SerialThrowingJob.run {
                try await block()
            }
            .get()
        }
    }
}

private extension SyncAsync {
    /// Wrapper on async block to run it synchronoulsy in code
    /// that doesn't support concurrency.
    /// Can be used with DispatchQueue API
    private final class SerialJob<Out> {
        typealias Job = () async -> Out
        private var sem = DispatchSemaphore(value: 0)
        private var result: Out?
        private var block: Job

        static func run(_ block: @escaping Job) -> Out {
            let instance = Self(block: block)
            return instance.run()
        }

        required init(block: @escaping Job) {
            self.block = block
        }

        private func run() -> Out {
            // `nonisolated(unsafe)` because the task is the only writer.
            nonisolated(unsafe) let job = self
            Task {
                job.result = await job.block()
                job.sem.signal()
            }
            self.sem.wait()
            return self.result!
        }
    }

    /// Wrapper on async throwing block to run it synchronoulsy in code
    /// that doesn't support concurrency
    /// Can be used with DispatchQueue API
    private final class SerialThrowingJob<Out> {
        typealias Job = () async throws -> Out
        private var sem = DispatchSemaphore(value: 0)
        private var result: Result<Out, Error>?
        private var block: Job

        static func run(_ block: @escaping Job) -> Result<Out, Error> {
            let instance = Self(block: block)
            return instance.run()
        }

        required init(block: @escaping Job) {
            self.block = block
        }

        private func run() -> Result<Out, Error> {
            // `nonisolated(unsafe)` because the task is the only writer.
            nonisolated(unsafe) let job = self
            Task {
                defer { job.sem.signal() }

                var res: Out!
                do {
                    res = try await job.block()
                } catch {
                    job.result = .failure(error)
                    return
                }
                job.result = .success(res)
            }
            self.sem.wait()
            return self.result!
        }
    }
}
