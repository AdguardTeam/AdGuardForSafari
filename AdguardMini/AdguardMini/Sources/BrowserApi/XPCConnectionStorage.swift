// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  XPCConnectionStorage.swift
//  AdguardMini
//

import XPCGateLib
import AML

/// Storage for XPC connections.
protocol XPCConnectionStorage {
    /// Configure and store connection.
    func configureConnection(_ connection: NSXPCConnection, forProtocol protoId: String, exportedObject: Any?)
    /// Used to access remote proxies.
    /// - Parameters:
    ///   - proto: The protocol to which the remote proxy must conform.
    ///   - completion: A closure that is invoked for each matching remote proxy.
    func withRemoteProxies<ProxyProtocol>(_ proto: ProxyProtocol.Type, _ completion: @escaping (ProxyProtocol) -> Void)
    /// Invalidate and remove all connections.
    func reset()
}

final class XPCConnectionStorageImpl: XPCConnectionStorage {
    private let workQueue = DispatchQueue(label: "XPCConnectionStorageWorkQueue", autoreleaseFrequency: .workItem)

    private var connections = Set<NSXPCConnection>()

    func configureConnection(_ connection: NSXPCConnection, forProtocol protoId: String, exportedObject: Any?) {
        self.workQueue.sync {
            connection.exportedObject = exportedObject

            connection.exportedInterface     = NSXPCInterface(with: MainAppApi.self)
            connection.remoteObjectInterface = NSXPCInterface(with: SafariPopupApi.self)

            func cleanup(_ conn: NSXPCConnection) {
                self.workQueue.async {
                    conn.exportedObject = nil
                    self.connections.remove(conn)
                }
            }

            connection.interruptionHandler = {
                cleanup(connection)
            }

            connection.invalidationHandler = {
                cleanup(connection)
            }

            self.connections.insert(connection)
        }
    }

    func withRemoteProxies<ProxyProtocol>(
        _ proto: ProxyProtocol.Type,
        _ completion: @escaping (ProxyProtocol) -> Void
    ) {
        self.workQueue.sync {
            for conn in self.connections {
                if let proxy = conn.remoteObjectProxy as? ProxyProtocol {
                    completion(proxy)
                }
            }
        }
    }

    func reset() {
        self.workQueue.sync {
            for conn in self.connections {
                conn.invalidate()
            }
            self.connections.removeAll()
        }
    }
}
