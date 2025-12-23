// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PopupViewController.swift
//  EntryExtension
//

import SafariServices
import SwiftUI

import AML

class PopupViewController: SFSafariExtensionViewController, PopupViewControllerDelegate {
    private let mainView: PopupView

    // MARK: Init

    init(mainView: PopupView) {
        self.mainView = mainView

        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: Overrides

    override func loadView() {
        self.view = NSHostingView(rootView: self.mainView)
    }
}
