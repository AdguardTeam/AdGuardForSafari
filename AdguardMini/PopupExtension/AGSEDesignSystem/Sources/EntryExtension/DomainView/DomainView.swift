// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  DomainView.swift
//  AGSEDesignSystem
//

import SwiftUI
import ColorPalette

// MARK: - DomainView

public struct DomainView: View {
    // MARK: Private properties

    @Binding private var isProtectionEnabled: Bool

    // MARK: Public properties

    var configuration: Configuration

    // MARK: Init

    public init(
        isProtectionEnabled: Binding<Bool>,
        configuration: Configuration
    ) {
        self.configuration = configuration
        self._isProtectionEnabled = isProtectionEnabled
    }

    // MARK: UI

    public var body: some View {
        VStack(spacing: Space.zero) {
            self.separator
            self.domain
            self.separator
            self.protection
            self.separator
            self.blockElement
            self.separator
            self.reportAnIssue
            self.separator
//            self.rateAdguardMini
            if self.configuration.state.hasAttention {
                self.attention
            }
        }
    }

    @ViewBuilder
    private var attention: some View {
        PopupAttentionCell(
            title: self.configuration.attentionConfiguration.title,
            buttonText: self.configuration.attentionConfiguration.buttonText,
            action: self.configuration.attentionConfiguration.action
        )
    }

    @ViewBuilder
    private var domain: some View {
        PopupCell(
            configuration: .init(
                content: .init(
                    title: self.configuration.domain,
                    hint: self.hintText,
                    leftIcon: SEImage.Popup.webBrowsingSecurity
                ),
                appearance: .init(
                    titleConfiguration: .domain(),
                    hintConfiguration: .subtitle(
                        alignment: .leading,
                        multilineTextAlignment: .leading
                    ),
                    leftIconColor: Palette.Icon.productIcon
                )
            )
        )
    }

    @ViewBuilder
    private var protection: some View {
        PopupToggleCell(
            isOn: self.$isProtectionEnabled,
            configuration: .init(
                content: .init(
                    title: self.configuration.protectionTitle,
                    leftIcon: SEImage.Popup.safari
                ),
                appearance: .init(
                    titleConfiguration: .popupCell(),
                    hintConfiguration: .subtitle(
                        alignment: .leading,
                        multilineTextAlignment: .leading
                    ),
                    leftIconColor: Palette.Icon.productIcon
                ),
                isEnabled: !self.configuration.state.isDisabled
            )
        )
    }

    @ViewBuilder
    private var blockElement: some View {
        PopupCellButton(
            isEnabled: !self.configuration.state.isDisabled,
            title: self.configuration.blockElementConfiguration.title,
            leftIcon: SEImage.Popup.target,
            leftIconColor: Palette.Icon.errorIcon,
            action: self.configuration.blockElementConfiguration.action
        )
    }

    @ViewBuilder
    private var reportAnIssue: some View {
        PopupCellButton(
            isEnabled: !self.configuration.state.isDisabled,
            title: self.configuration.reportAnIssueConfiguration.title,
            leftIcon: SEImage.Popup.dislike,
            leftIconColor: Palette.Icon.attentionIcon,
            action: self.configuration.reportAnIssueConfiguration.action
        )
    }

//    @ViewBuilder
//    private var rateAdguardMini: some View {
//        PopupCellButton(
//            isEnabled: true,
//            title: self.configuration.rateAdguardMiniConfiguration.title,
//            leftIcon: SEImage.Popup.star,
//            leftIconColor: Palette.Icon.productIcon,
//            action: self.configuration.rateAdguardMiniConfiguration.action
//        )
//    }

    @ViewBuilder
    private var separator: some View {
        Divider()
            .background(Palette.strokeInputsInactiveInputStrokeDefault)
    }

    private var hintText: String? {
        !self.isProtectionEnabled
        ? self.configuration.hint
        : nil
    }
}

// MARK: - DomainView_Previews

private enum PreviewBuilder {
    static func buildDomainView(
        isProtectionEnabled: Bool = true,
        isDisabled: Bool = false,
        hasAttention: Bool = false,
        domain: String = Self.defaultDomain,
        hint: String = Self.defaultHint,
        attentionTitle: String = Self.attentionTitle,
        attentionButtonTitle: String = Self.attentionButtonTitle,
        protectionTitle: String = Self.protectionTitle,
        blockElementTitle: String = Self.blockElementTitle,
        reportAnIssueTitle: String = Self.reportAnIssueTitle,
//        rateAdguardMiniConfiguration: String = Self.rateAdguardMiniConfiguration
    ) -> some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Text("Header example")
                Spacer()
            }
            .background(Color.accentColor)
            DomainView(
                isProtectionEnabled: .constant(isProtectionEnabled),
                configuration: .init(
                    state: .init(
                        isDisabled: isDisabled,
                        hasAttention: hasAttention
                    ),
                    domain: domain,
                    hint: hint,
                    protectionTitle: protectionTitle,
                    attentionConfiguration: .init(
                        title: attentionTitle,
                        buttonText: attentionButtonTitle
                    ) {
                        print("\(attentionButtonTitle) clicked")
                    },
                    blockElementConfiguration: .init(
                        title: blockElementTitle
                    ) {
                        print("\(blockElementTitle) clicked")
                    },
                    reportAnIssueConfiguration: .init(
                        title: reportAnIssueTitle
                    ) {
                        print("\(reportAnIssueTitle) clicked")
                    }
//                    rateAdguardMiniConfiguration: .init(
//                        title: rateAdguardMiniConfiguration
//                    ) {
//                        print("\(rateAdguardMiniConfiguration) clicked")
//                    }
                )
            )
        }
        .border(.black)
        .frame(width: 320)
    }

    static let defaultDomain = "fonts.google.com"
    static let defaultHint = "Protection is off for this website as it may interfere with its operation"
    static let protectionTitle = "Protection"
    static let attentionTitle = "Some extensions are off"
    static let attentionButtonTitle = "Some extensions are off"
    static let blockElementTitle = "Block element"
    static let reportAnIssueTitle = "Report an issue"
//    static let rateAdguardMiniConfiguration = "Rate AdGuard Mini"
}

#Preview("Domain enabled") {
    Group {
        VStack {
            HStack {
                PreviewBuilder.buildDomainView()
                PreviewBuilder.buildDomainView(isDisabled: true)
            }
            HStack {
                PreviewBuilder.buildDomainView(hasAttention: true)
                PreviewBuilder.buildDomainView(isDisabled: true, hasAttention: true)
            }
        }
        .padding()
    }
}

#Preview("Domain disabled") {
    Group {
        VStack {
            HStack {
                PreviewBuilder.buildDomainView(isProtectionEnabled: false)

                PreviewBuilder.buildDomainView(
                    isProtectionEnabled: false,
                    isDisabled: true
                )
            }

            HStack {
                PreviewBuilder.buildDomainView(isProtectionEnabled: false, hasAttention: true)

                PreviewBuilder.buildDomainView(
                    isProtectionEnabled: false,
                    isDisabled: true,
                    hasAttention: true
                )
            }
        }
        .padding()
    }
}

#Preview("System domain") {
    Group {
        VStack {
            PreviewBuilder.buildDomainView(
                isDisabled: true,
                domain: "Secure page",
                hint: "Technically, you shouldn't see this text."
            )

            PreviewBuilder.buildDomainView(
                isDisabled: true,
                hasAttention: true,
                domain: "Secure page",
                hint: "Technically, you shouldn't see this text."
            )
        }
        .padding()
    }
}
