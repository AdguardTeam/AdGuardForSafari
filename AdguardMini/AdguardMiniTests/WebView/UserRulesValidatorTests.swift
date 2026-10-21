// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesValidatorTests.swift
//  AdguardMiniTests
//

import XCTest
import ProtoSchema

/// `@MainActor` because the code under test is main-actor isolated.
@MainActor
final class UserRulesValidatorTests: XCTestCase {
    private func rules(count: Int, length: Int) -> UserRules {
        UserRules(rules: (0..<count).map { _ in
            UserRule(rule: String(repeating: "a", count: length), enabled: true)
        })
    }

    /// Extracts failure from `Result<Void, Failure>`.
    private func failureOf(
        _ result: Result<Void, UserRulesValidator.Failure>
    ) -> UserRulesValidator.Failure? {
        if case .failure(let failure) = result {
            return failure
        }
        return nil
    }

    func testEmptyRules_AreValid() {
        XCTAssertNil(failureOf(UserRulesValidator.validate(UserRules(), maxRules: 150_000)))
    }

    func testAtCap_IsValid() {
        XCTAssertNil(failureOf(UserRulesValidator.validate(rules(count: 3, length: 10), maxRules: 3)))
    }

    func testOverCount_IsRejected() {
        XCTAssertEqual(
            failureOf(UserRulesValidator.validate(rules(count: 4, length: 10), maxRules: 3)),
            .tooManyRules(max: 3)
        )
    }

    func testOverPerRuleLength_IsRejected() {
        let long = UserRules(rules: [UserRule(rule: String(repeating: "b", count: 65_537), enabled: true)])
        XCTAssertEqual(
            failureOf(UserRulesValidator.validate(long, maxRules: 150_000)),
            .ruleTooLong(maxLength: 65_536)
        )
    }

    func testOverTotalBytes_IsRejected() {
        let big = UserRules(rules: (0..<64_000).map { _ in
            UserRule(rule: String(repeating: "c", count: 1100), enabled: true)
        })
        XCTAssertEqual(
            failureOf(UserRulesValidator.validate(big, maxRules: 150_000)),
            .payloadTooLarge(maxBytes: 32 * 1024 * 1024)
        )
    }

    /// The per-rule cap counts CHARACTERS, not UTF-8 bytes: a multibyte rule
    /// (e.g. CJK) under the character cap must not be wrongly rejected.
    func testMultibyteRule_WithinCharacterCap_IsAccepted() {
        // 3000 CJK characters = 9000 UTF-8 bytes, but 3000 characters < 65 536.
        let cjk = String(repeating: "中", count: 3000)
        let multibyte = UserRules(rules: [UserRule(rule: cjk, enabled: true)])
        XCTAssertNil(
            failureOf(UserRulesValidator.validate(multibyte, maxRules: 150_000)),
            "Multibyte rules must be measured in characters, not bytes"
        )
    }

    /// A multibyte rule past the character cap is still rejected.
    func testMultibyteRule_OverCharacterCap_IsRejected() {
        let cjk = String(repeating: "中", count: 65_537)
        let multibyte = UserRules(rules: [UserRule(rule: cjk, enabled: true)])
        XCTAssertEqual(
            failureOf(UserRulesValidator.validate(multibyte, maxRules: 150_000)),
            .ruleTooLong(maxLength: 65_536)
        )
    }

    func testImportAllowed_AtByteCap_IsAllowed() {
        let content = String(repeating: "a", count: UserRulesValidator.maxImportedContentBytes)
        XCTAssertTrue(
            UserRulesValidator.isImportAllowed(content: content),
            "Content exactly at the import cap must be allowed"
        )
    }

    func testImportAllowed_OverByteCap_IsRejected() {
        let content = String(repeating: "a", count: UserRulesValidator.maxImportedContentBytes + 1)
        XCTAssertFalse(
            UserRulesValidator.isImportAllowed(content: content),
            "One byte over the import cap must be rejected"
        )
    }

    /// The import cap counts UTF-8 BYTES, so multibyte text hits it sooner.
    func testImportAllowed_MultibyteContent_IsMeasuredInBytes() {
        // 3 bytes per CJK character: the character count stays under the cap.
        let content = String(repeating: "中", count: UserRulesValidator.maxImportedContentBytes / 3 + 1)
        XCTAssertFalse(
            UserRulesValidator.isImportAllowed(content: content),
            "Multibyte content must be measured in bytes, not characters"
        )
    }

    /// Pins the cap value itself, which the boundary checks derive from.
    func testImportCap_IsThirtyTwoMiB() {
        XCTAssertEqual(UserRulesValidator.maxImportedContentBytes, 32 * 1024 * 1024)
    }
}
