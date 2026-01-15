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
    private let viewModel: PopupView.ViewModel

    // MARK: Init

    init(mainView: PopupView, viewModel: PopupView.ViewModel) {
        self.mainView = mainView
        self.viewModel = viewModel

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

    override func viewDidAppear() {
        super.viewDidAppear()
        self.viewModel.sendPageViewForCurrentLayout()
    }
}
