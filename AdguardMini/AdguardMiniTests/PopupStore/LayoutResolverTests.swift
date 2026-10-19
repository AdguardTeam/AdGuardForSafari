// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  LayoutResolverTests.swift
//  AdguardMiniTests
//

import XCTest

// MARK: - Constants

private enum Constants {
    static let exampleDomain = "example.com"
}

/// `@MainActor` because the code under test is main-actor isolated.
@MainActor
final class LayoutResolverTests: XCTestCase {    // MARK: Helpers

    private func resolve(
        mainAppRunning: Bool = true,
        onboardingStatus: Store.OnboardingStatus = .completed,
        protectionEnabled: Bool = true,
        lastError: Store.Error? = nil,
        xpcAvailable: Bool = true
    ) -> Store.PopupLayout {
        LayoutResolver.resolve(
            mainAppRunning: mainAppRunning,
            onboardingStatus: onboardingStatus,
            protectionEnabled: protectionEnabled,
            lastError: lastError,
            xpcAvailable: xpcAvailable
        )
    }

    // MARK: Happy path

    func testHappyPathProducesDomain() {
        XCTAssertEqual(self.resolve(), .domain)
    }

    // MARK: Main app dominance

    func testMainAppNotRunningAlwaysProducesAdguardNotLaunched() {
        // Truth table: 3 remaining flags free, must be .adguardNotLaunched for every combination.
        for status in [Store.OnboardingStatus.unknown, .completed, .notCompleted] {
            for protectionOn in [false, true] {
                XCTAssertEqual(
                    self.resolve(
                        mainAppRunning: false,
                        onboardingStatus: status,
                        protectionEnabled: protectionOn
                    ),
                    .adguardNotLaunched,
                    "mainAppRunning=false must dominate; status=\(status) protectionOn=\(protectionOn)"
                )
            }
        }
    }

    // MARK: Onboarding gating

    func testUnknownOnboardingWithRunningAppProducesDomainRegardlessOfProtectionState() {
        // While the first XPC reply is in flight the popup renders optimistically.
        // `.domain` is returned for `.unknown` regardless of protectionEnabled,
        // Because protectionEnabled is false in State.initial and has not been
        // Loaded from the main app yet.
        XCTAssertEqual(
            self.resolve(onboardingStatus: .unknown, protectionEnabled: true),
            .domain
        )
        XCTAssertEqual(
            self.resolve(onboardingStatus: .unknown, protectionEnabled: false),
            .domain
        )
    }

    func testNotCompletedOnboardingProducesOnboardingWasntCompleted() {
        XCTAssertEqual(
            self.resolve(onboardingStatus: .notCompleted),
            .onboardingWasntCompleted
        )
    }

    // MARK: Protection gating

    func testProtectionDisabledProducesProtectionIsDisabled() {
        XCTAssertEqual(
            self.resolve(protectionEnabled: false),
            .protectionIsDisabled
        )
    }

    // MARK: Error routing

    func testDomainBranchWithErrorProducesSomethingWentWrong() {
        // When the resolved layout would be .domain and there is a recorded error.
        // Layout flips to .somethingWentWrong.
        XCTAssertEqual(
            self.resolve(lastError: .protectionToggleFailed(domain: Constants.exampleDomain)),
            .somethingWentWrong
        )
    }

    func testNonDomainBranchKeepsLayoutOnError() {
        // For non-.domain branches, error does not change the layout.
        // The error is surfaced via popupState
        // = .error elsewhere; the resolver simply preserves the layout.
        XCTAssertEqual(
            self.resolve(protectionEnabled: false, lastError: .openSettingsFailed),
            .protectionIsDisabled
        )
        XCTAssertEqual(
            self.resolve(onboardingStatus: .notCompleted, lastError: .launchFailed),
            .onboardingWasntCompleted
        )
        XCTAssertEqual(
            self.resolve(mainAppRunning: false, lastError: .launchFailed),
            .adguardNotLaunched
        )
    }

    // MARK: XPC unavailable

    func testXpcUnavailableWithRunningAppProducesXpcUnavailable() {
        XCTAssertEqual(
            self.resolve(xpcAvailable: false),
            .xpcUnavailable
        )
    }

    func testMainAppNotRunningDominatesXpcUnavailable() {
        XCTAssertEqual(
            self.resolve(mainAppRunning: false, xpcAvailable: false),
            .adguardNotLaunched
        )
    }

    // MARK: Priority ordering — exhaustive truth table

    // The inline expected-value closure is intentional — a helper would duplicate resolver logic and risk masking identical bugs.
    // swiftlint:disable cyclomatic_complexity
    /// Lock down the precedence chain so future changes to the resolver must update this test:
    ///   1. !mainAppRunning                   -> .adguardNotLaunched
    ///   2. !xpcAvailable                     -> .xpcUnavailable
    ///   3. onboardingStatus == .notCompleted -> .onboardingWasntCompleted
    ///   4. !protectionEnabled                -> .protectionIsDisabled
    ///   5. lastError != nil                  -> .somethingWentWrong
    ///   6. otherwise (incl. .unknown)        -> .domain
    func testFullTruthTablePrecedence() {
        let allStatuses: [Store.OnboardingStatus] = [.unknown, .completed, .notCompleted]
        for mainAppRunning in [false, true] {
            for xpcAvailable in [false, true] {
                for onboardingStatus in allStatuses {
                    for protectionEnabled in [false, true] {
                        for hasError in [false, true] {
                            let lastError: Store.Error? = hasError ? .appStateFetchFailed : nil
                            let actual = self.resolve(
                                mainAppRunning: mainAppRunning,
                                onboardingStatus: onboardingStatus,
                                protectionEnabled: protectionEnabled,
                                lastError: lastError,
                                xpcAvailable: xpcAvailable
                            )
                            let expected: Store.PopupLayout = {
                                if !mainAppRunning { return .adguardNotLaunched }
                                if !xpcAvailable { return .xpcUnavailable }
                                if onboardingStatus == .unknown { return .domain }
                                if onboardingStatus == .notCompleted { return .onboardingWasntCompleted }
                                if !protectionEnabled { return .protectionIsDisabled }
                                if lastError != nil { return .somethingWentWrong }
                                return .domain
                            }()
                            XCTAssertEqual(
                                actual, expected,
                                "mainAppRunning=\(mainAppRunning) xpcAvailable=\(xpcAvailable) onboardingStatus=\(onboardingStatus) protectionEnabled=\(protectionEnabled) hasError=\(hasError)"
                            )
                        }
                    }
                }
            }
        }
    }
    // swiftlint:enable cyclomatic_complexity
}
