// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SciterApp.swift
//  AdguardMini
//

import Foundation

import AML
import SciterSwift

/// Сlass that is the base class for Sciter applications.
///
/// Responsible for injecting dependencies, creating the application window and launching it correctly.
/// It is a wrapper over the base ``SciterSwift.App``.
class SciterApp: SciterWindowControllerImpl, SciterServiceDependent {
    let app: SciterSwift.App

    init(
        windowRect: CGRect,
        archivePath: String,
        hideOnLoosingFocus: Bool,
        enableFrameAutosave: Bool
    ) {
        let sciterApp = SciterSwift.App()
        self.app = sciterApp

        super.init(
            sciterApp,
            windowRect: windowRect,
            archivePath: archivePath,
            hideOnLoosingFocus: hideOnLoosingFocus
        )

        self.setupSciterServices()

        self.app.start()
        LogInfo("[\(type(of: self))] Started - rect: \(windowRect)")

        // IMPORTANT: setFrameAutosaveName must be called AFTER self.app.start()
        // Because start() performs frame manipulations that would interfere with autosave
        guard enableFrameAutosave,
              let window = self.nsWindow else { return }
        let autosaveName = Self.className()
        if !window.setFrameAutosaveName(autosaveName) {
            LogWarn("Can't set frame autosave name: \(autosaveName)")
        }
    }

    deinit {
        self.app.releaseServices()
        LogDebug("[\(type(of: self))] Deinitialized, services released")
    }

    @MainActor
    func isAppHidden() -> Bool {
        guard let window = self.nsWindow else { return true }
        let isHidden = !window.occlusionState.contains(.visible)
        LogDebug("[\(type(of: self))] isAppHidden: \(isHidden) (occlusionState: \(window.occlusionState.rawValue))")
        return isHidden
    }
}
