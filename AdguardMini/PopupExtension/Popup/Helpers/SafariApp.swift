// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariApp.swift
//  PopupExtension
//

import SafariServices

/// An object that is a wrapper for the necessary functions of the ``SFSafariApplication`` class.
protocol SafariApp {
    func setToolbarItemsNeedUpdate()
    func getActiveWindow() async -> SFSafariWindow?
    func getActivePage() async -> SFSafariPage?
    func getPropertiesOfActivePage(in window: SFSafariWindow) async -> SFSafariPageProperties?
    func openUrlInNewTab(_ url: URL) async
    func reloadActivePage() async
}

final class SafariAppImpl: SafariApp {
    func setToolbarItemsNeedUpdate() {
        SFSafariApplication.setToolbarItemsNeedUpdate()
    }

    func getActiveWindow() async -> SFSafariWindow? {
        await SFSafariApplication.activeWindow()
    }

    func getActivePage() async -> SFSafariPage? {
        await self.getActivePage(in: await self.getActiveWindow())
    }

    func getPropertiesOfActivePage(in window: SFSafariWindow) async -> SFSafariPageProperties? {
        await self.getActivePage(in: window)?.properties()
    }

    private func getActivePage(in window: SFSafariWindow?) async -> SFSafariPage? {
        await window?.activeTab()?.activePage()
    }

    func openUrlInNewTab(_ url: URL) async {
        await self.getActiveWindow()?.openTab(with: url, makeActiveIfPossible: true)
    }

    func reloadActivePage() async {
        await self.getActivePage()?.reload()
    }
}
