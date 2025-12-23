// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterAppBuilder.swift
//  AdguardMini
//

import Foundation
import SciterSwift

extension SciterSwift.App {
    /// Sciter NSWindow setup
    private func makeWindow(url: String, rect: CGRect) -> Window {
        let window = Window(urlString: url, rect: rect)
        window.nswindow?.minSize = NSSize(width: rect.width, height: rect.height)
        return window
    }

    @discardableResult
    func setupWindow(windowRect: CGRect, archivePath: String) -> Self {
        let window = self.makeWindow(url: archivePath, rect: windowRect)
        return self.setup(window: window)
    }
}
