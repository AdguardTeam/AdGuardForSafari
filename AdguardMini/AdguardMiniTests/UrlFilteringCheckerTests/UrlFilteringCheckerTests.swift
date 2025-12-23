// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UrlFilteringCheckerTests.swift
//  AdguardMiniTests
//

import XCTest

final class UrlFilteringCheckerTests: XCTestCase {
    private let fChecker = UrlFilteringCheckerImpl(urlBuilder: AllowBlockListRuleBuilderImpl())
    private let testHost = "example.com"
    private let testHost2 = "www.example.com"

    func testHostInAllowList1() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$important,document"]))
    }

    func testHostInAllowList2() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$document,important"]))
    }

    func testHostInAllowList3() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$important,document,content"]))
    }

    func testHostInAllowList4() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$document,content,important"]))
    }

    func testHostInAllowList5() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost, by: ["@@||www.example.com^$document,content,important"]))
    }

    func testHostInAllowList6() {
        XCTAssertTrue(fChecker.isHostInAllowList(self.testHost2, by: ["@@||example.com^$document,important"]))
    }

    func testNotHostInAllowList1() {
        XCTAssertFalse(fChecker.isHostInAllowList(self.testHost, by: []))
    }

    func testNotHostInAllowList2() {
        XCTAssertFalse(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$"]))
    }

    func testNotHostInAllowList3() {
        XCTAssertFalse(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$important"]))
    }

    func testNotHostInAllowList4() {
        XCTAssertFalse(fChecker.isHostInAllowList(self.testHost, by: ["@@||example.com^$document"]))
    }

    func testNotHostInAllowList5() {
        // swiftlint:disable:next force_try
        let content = try! String(contentsOf: Bundle.current.urlForFilter(number: 1)!)
            .components(separatedBy: CharacterSet.newlines)
        XCTAssertFalse(fChecker.isHostInAllowList(self.testHost, by: content))
    }
}

private extension Bundle {
    static var current: Bundle {
        Bundle(for: UrlFilteringCheckerTests.self)
    }

    func urlForFilter(number: Int) -> URL? {
        self.url(forResource: "Filter\(number)", withExtension: "txt")
    }
}
