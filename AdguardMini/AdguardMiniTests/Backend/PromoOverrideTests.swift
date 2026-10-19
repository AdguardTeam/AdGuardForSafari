// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PromoOverrideTests.swift
//  AdguardMiniTests
//

import XCTest

/// Covers the `devConfig.json` promo override that replaces the backend promo.
final class PromoOverrideTests: XCTestCase {
    /// Without the key the backend answer stays in place.
    func testReturnsNilWithoutOverride() {
        XCTAssertNil(DeveloperConfigUtils.promoOverride(from: nil))
    }

    /// A value that is not an object of strings cannot describe the card.
    func testReturnsNilForNonObjectValue() {
        XCTAssertNil(DeveloperConfigUtils.promoOverride(from: "Black Friday"))
        XCTAssertNil(DeveloperConfigUtils.promoOverride(from: ["title": 1]))
    }

    /// The card text comes from the override; a field it omits stays empty.
    func testMapsTitleAndLabel() throws {
        let promo = try XCTUnwrap(DeveloperConfigUtils.promoOverride(from: [
            "title": "Black Friday",
            "label": "~50% off the first year!"
        ]))

        XCTAssertEqual(promo.title, "Black Friday")
        XCTAssertEqual(promo.label, "~50% off the first year!")

        let titleOnly = try XCTUnwrap(DeveloperConfigUtils.promoOverride(from: ["title": "Black Friday"]))
        XCTAssertEqual(titleOnly.title, "Black Friday")
        XCTAssertEqual(titleOnly.label, "")
    }
}
