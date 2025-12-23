// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  HeaderView.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - Constants

fileprivate enum Constants {
    static let height: CGFloat = 24

    static let padding = EdgeInsets(
        vertical: Margin.expanded,
        horizontal: Margin.regular
    )

    static let buttonPadding = EdgeInsets(side: Margin.zero)
}

// MARK: - HeaderView

public struct HeaderView: View {
    // MARK: Private properties

    private var isBusy: Bool
    private var isPauseButtonAvailable: Bool
    private var isSettingsButtonAvailable: Bool

    private var pauseAction: () -> Void
    private var settingsAction: () -> Void

    // MARK: Init

    public init(
        isBusy: Bool,
        isPauseButtonAvailable: Bool,
        isSettingsButtonAvailable: Bool = true,
        pauseAction: @escaping () -> Void = {},
        settingsAction: @escaping () -> Void = {}
    ) {
        self.isBusy = isBusy
        self.isPauseButtonAvailable = isPauseButtonAvailable
        self.isSettingsButtonAvailable = isSettingsButtonAvailable
        self.pauseAction = pauseAction
        self.settingsAction = settingsAction
    }

    // MARK: UI

    public var body: some View {
        HStack(spacing: Space.regular) {
            SEImage.Adguard.logo
            Spacer(minLength: Space.small)
            if self.isBusy {
                ProgressView()
                    .progressViewStyle(.circular)
                    .controlSize(.small)
            }
            if self.isPauseButtonAvailable {
                self.button(for: SEImage.Popup.pause, action: self.pauseAction)
            }
            if self.isSettingsButtonAvailable {
                self.button(for: SEImage.Popup.settings, action: self.settingsAction)
            }
        }
        .padding(Constants.padding)
    }

    private func button(for icon: Image, action: @escaping () -> Void) -> some View {
        AGButton(
            configuration: .icon(
                icon: icon,
                isEnabled: !self.isBusy
            ),
            action: action
        )
    }
}

// MARK: - HeaderView_Previews

struct HeaderView_Previews: PreviewProvider {
    static var previews: some View {
        let mainSpacing = Space.compact
        let spacing: CGFloat = 4
        Group {
            VStack(spacing: mainSpacing) {
                VStack(spacing: spacing) {
                    Text("Domain view default")
                    HeaderView(
                        isBusy: false,
                        isPauseButtonAvailable: true
                    )
                    .border(.black)
                }

                VStack(spacing: spacing) {
                    Text("Domain view busy")
                    HeaderView(
                        isBusy: true,
                        isPauseButtonAvailable: true
                    )
                    .border(.black)
                }

                VStack(spacing: spacing) {
                    Text("Info view default")
                    HeaderView(
                        isBusy: false,
                        isPauseButtonAvailable: false
                    )
                    .border(.black)
                }
                VStack(spacing: spacing) {
                    Text("Info view busy")
                    HeaderView(
                        isBusy: true,
                        isPauseButtonAvailable: false
                    )
                    .border(.black)
                }
                VStack(spacing: spacing) {
                    Text("Onboarding view")
                    HeaderView(
                        isBusy: false,
                        isPauseButtonAvailable: false,
                        isSettingsButtonAvailable: false
                    )
                    .border(.black)
                }
                VStack(spacing: spacing) {
                    Text("Onboarding view busy")
                    HeaderView(
                        isBusy: true,
                        isPauseButtonAvailable: false,
                        isSettingsButtonAvailable: false
                    )
                    .border(.black)
                }
            }
            .frame(width: 320)
        }
        .padding()
    }
}
