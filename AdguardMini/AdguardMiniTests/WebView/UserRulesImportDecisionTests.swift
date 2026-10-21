// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesImportDecisionTests.swift
//  AdguardMiniTests
//

import XCTest
import ProtoSchema

/// Tests for `UserRulesImportDecision`: the import-cap boundary, the path
/// guard, and the bridge reply it produces.
final class UserRulesImportDecisionTests: XCTestCase {
    /// A readable file within the cap is persisted.
    func testMake_AllowedText_Saves() {
        guard case .save(let text) = UserRulesImportDecision.make(.success("||example.org^")) else {
            XCTFail("Allowed text must resolve to .save")
            return
        }
        XCTAssertEqual(text, "||example.org^")
    }

    /// Text exactly at the import cap is still persisted.
    func testMake_TextAtCap_Saves() {
        let text = String(repeating: "a", count: UserRulesValidator.maxImportedContentBytes)
        guard case .save = UserRulesImportDecision.make(.success(text)) else {
            XCTFail("Text at the cap must resolve to .save")
            return
        }
    }

    /// One byte over the cap is rejected instead of being persisted.
    func testMake_TextOverCap_Rejects() {
        let text = String(repeating: "a", count: UserRulesValidator.maxImportedContentBytes + 1)
        guard case .overCap = UserRulesImportDecision.make(.success(text)) else {
            XCTFail("Text over the cap must resolve to .overCap")
            return
        }
    }

    /// A file the reader could not load is rejected with the reader's error.
    func testMake_UnreadableFile_Rejects() {
        guard case .unreadable(let error) = UserRulesImportDecision.make(.failure(ReadError())) else {
            XCTFail("A read failure must resolve to .unreadable")
            return
        }
        XCTAssertTrue(error is ReadError, "The reader's error must be carried through")
    }

    /// An unconfined path is rejected before the file is read.
    func testMake_UnconfinedPath_RejectsWithoutLoading() async {
        var loadCalled = false
        let decision = await UserRulesImportDecision.make(isConfined: false) {
            loadCalled = true
            return .success("||example.org^")
        }

        guard case .notConfined = decision else {
            XCTFail("An unconfined path must resolve to .notConfined")
            return
        }
        XCTAssertFalse(loadCalled, "The file must not be read when the path is not confined")
    }

    /// A confined readable file within the cap is persisted.
    func testMake_ConfinedReadable_Saves() async {
        let decision = await UserRulesImportDecision.make(isConfined: true) {
            .success("||example.org^")
        }

        guard case .save(let text) = decision else {
            XCTFail("A confined readable file must resolve to .save")
            return
        }
        XCTAssertEqual(text, "||example.org^")
    }

    /// A confined file the reader could not load is rejected with its error.
    func testMake_ConfinedUnreadable_Rejects() async {
        let decision = await UserRulesImportDecision.make(isConfined: true) {
            .failure(ReadError())
        }

        guard case .unreadable(let error) = decision else {
            XCTFail("A confined unreadable file must resolve to .unreadable")
            return
        }
        XCTAssertTrue(error is ReadError, "The reader's error must be carried through")
    }

    /// A confined file over the cap is rejected instead of being persisted.
    func testMake_ConfinedOverCap_Rejects() async {
        let text = String(repeating: "a", count: UserRulesValidator.maxImportedContentBytes + 1)
        let decision = await UserRulesImportDecision.make(isConfined: true) {
            .success(text)
        }

        guard case .overCap = decision else {
            XCTFail("A confined file over the cap must resolve to .overCap")
            return
        }
    }

    /// A saved import replies with the rules read after the save.
    func testReply_Save_ReturnsImportedRules() async {
        let imported = UserRules(enabled: true, rules: [UserRule(rule: "||example.org^", enabled: true)])
        var currentRulesCalled = false

        let reply = await UserRulesImportDecision.save("||example.org^").reply {
            currentRulesCalled = true
            return imported
        }

        XCTAssertTrue(currentRulesCalled, "A saved import must read the current rules")
        XCTAssertEqual(reply.result, .userRules(imported), "A saved import must reply with the rules")
    }

    /// Every rejection replies the failure arm without reading the rules.
    func testReply_Rejections_ReturnFailure() async {
        let rejections: [(name: String, decision: UserRulesImportDecision)] = [
            (".unreadable", .unreadable(ReadError())),
            (".overCap", .overCap),
            (".notConfined", .notConfined)
        ]

        for rejection in rejections {
            var currentRulesCalled = false
            let reply = await rejection.decision.reply {
                currentRulesCalled = true
                return UserRules()
            }

            XCTAssertFalse(currentRulesCalled, "\(rejection.name) must not read the rules")
            XCTAssertEqual(reply.result, .error(true), "\(rejection.name) must reply the failure arm")
        }
    }
}

/// Error stand-in for a file the reader could not load.
private struct ReadError: Error {}
