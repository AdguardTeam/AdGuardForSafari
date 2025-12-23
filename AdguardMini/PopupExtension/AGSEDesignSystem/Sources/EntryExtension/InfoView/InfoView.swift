// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  InfoView.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - Constants

fileprivate enum Constants {
    static let padding = EdgeInsets(side: Margin.regular)

    static let textPadding = EdgeInsets(
        top: Margin.expanded,
        leading: Margin.regular,
        bottom: Margin.small,
        trailing: Margin.regular
    )
}

// MARK: - InfoView

public struct InfoView: View {
    // MARK: Public properties

    public var configuration: Configuration

    // MARK: Init

    public init(configuration: Configuration) {
        self.configuration = configuration
    }

    // MARK: Body

    public var body: some View {
        VStack {
            self.configuration.image
            self.textSection
            AGButton(
                configuration: .primary(
                    text: self.buttonText,
                    state: .init(
                        isEnabled: self.configuration.state != .loading
                    )
                ),
                action: self.configuration.action
            )
            .padding(Constants.padding)
        }
        .padding(.bottom, Margin.small)
    }

    // MARK: Private properties

    private var textSection: some View {
        VStack(spacing: Space.small) {
            Text(self.title)
                .textStyle(.title())
            Text(self.text)
                .textStyle(.subtitle())
        }
        .padding(Constants.textPadding)
    }

    private var title: String {
        self.currentContent.title
    }

    private var text: String {
        self.currentContent.text
    }

    private var buttonText: String {
        self.currentContent.buttonText
    }

    private var currentContent: Configuration.Content {
        let config = self.configuration
        switch config.state {
        case .base:
            return config.baseContent
        case .loading:
            return config.loadingContent
        case .error:
            return config.errorContent
        }
    }
}

// MARK: - InfoView_Previews

struct InfoView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            Group {
                self.notLaunched
                    .previewDisplayName("Not launched")
                self.protectionDisabled
                    .previewDisplayName("Protection disabled")
                self.somethingWentWrong
                    .previewDisplayName("Something went wrong")
                self.onboardingWasntCompleted
                    .previewDisplayName("Onboarding wasn't completed")
            }
            .frame(width: 320)
        }
        .padding()
    }

    @ViewBuilder
    private static var notLaunched: some View {
        let baseContent: InfoView.Configuration.Content = .init(
            title: "AdGuard Mini is not launched",
            text: "Your data may be exposed",
            buttonText: "Launch"
        )

        let loadingContent = baseContent.copy(with: "Launching...")

        let errorContent: InfoView.Configuration.Content = .init(
            title: "Failed to launch AdGuard Mini",
            text: "Please try again or contact support",
            buttonText: "Try again"
        )

        let configuration: InfoView.Configuration = .init(
            state: .base,
            image: SEImage.Adguard.thinkingAgnar,
            baseContent: baseContent,
            loadingContent: loadingContent,
            errorContent: errorContent
        )

        Self.previewVStack(
            [
                InfoView(configuration: configuration),
                InfoView(configuration: configuration.copy(with: .loading)),
                InfoView(configuration: configuration.copy(with: .error))
            ]
        )
    }

    @ViewBuilder
    private static var protectionDisabled: some View {
        let baseContent: InfoView.Configuration.Content = .init(
            title: "Protection is disabled",
            text: "Your data may be exposed",
            buttonText: "Enable"
        )

        let loadingContent = baseContent.copy(with: "Enabling...")

        let errorContent: InfoView.Configuration.Content = .init(
            title: "Failed to enable protection",
            text: "Please try again or contact support",
            buttonText: "Try again"
        )

        let configuration: InfoView.Configuration = .init(
            state: .base,
            image: SEImage.Adguard.thinkingAgnar,
            baseContent: baseContent,
            loadingContent: loadingContent,
            errorContent: errorContent
        )

        Self.previewVStack(
            [
                InfoView(configuration: configuration),
                InfoView(configuration: configuration.copy(with: .loading)),
                InfoView(configuration: configuration.copy(with: .error))
            ]
        )
    }

    @ViewBuilder
    private static var somethingWentWrong: some View {
        let baseContent: InfoView.Configuration.Content = .init(
            title: "Something went wrong",
            text: "Please restart the app or contact support",
            buttonText: "Restart AdGuard Mini"
        )

        let loadingContent = baseContent.copy(with: "Restarting AdGuard Mini...")

        let errorContent: InfoView.Configuration.Content = baseContent

        let configuration: InfoView.Configuration = .init(
            state: .base,
            image: SEImage.Adguard.thinkingAgnar,
            baseContent: baseContent,
            loadingContent: loadingContent,
            errorContent: errorContent
        )

        Self.previewVStack(
            [
                InfoView(configuration: configuration),
                InfoView(configuration: configuration.copy(with: .loading)),
                InfoView(configuration: configuration.copy(with: .error))
            ]
        )
    }

    @ViewBuilder
    private static var onboardingWasntCompleted: some View {
        let baseContent: InfoView.Configuration.Content = .init(
            title: "Set up your ad blocker",
            text: "To get AdGuard Mini up and running properly, you’ll need to check a few settings",
            buttonText: "Open AdGuard Mini"
        )

        let loadingContent = baseContent.copy(with: "Opening AdGuard Mini...")

        let errorContent: InfoView.Configuration.Content = baseContent

        let configuration: InfoView.Configuration = .init(
            state: .base,
            image: SEImage.Adguard.thumbsUpAgnar,
            baseContent: baseContent,
            loadingContent: loadingContent,
            errorContent: errorContent
        )

        Self.previewVStack(
            [
                InfoView(configuration: configuration),
                InfoView(configuration: configuration.copy(with: .loading)),
                InfoView(configuration: configuration.copy(with: .error))
            ]
        )
    }

    @ViewBuilder
    private static func previewVStack(_ views: [any View]) -> some View {
        let erased: [AnyView] = views.map { view in
            AnyView(view)
        }

        VStack(spacing: 16) {
            ForEach(Array(erased.enumerated()), id: \.offset) { _, view in
                view
                    .border(.black)
            }
        }
    }
}

private extension InfoView.Configuration {
    func copy(with newState: State) -> Self {
        Self(
            state: newState,
            image: self.image,
            baseContent: self.baseContent,
            loadingContent: self.loadingContent,
            errorContent: self.errorContent,
            action: self.action
        )
    }
}

private extension InfoView.Configuration.Content {
    func copy(with newButtonText: String) -> Self {
        Self(
            title: self.title,
            text: self.text,
            buttonText: newButtonText
        )
    }
}
