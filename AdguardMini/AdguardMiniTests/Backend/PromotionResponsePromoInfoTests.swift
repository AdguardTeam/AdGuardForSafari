// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  PromotionResponsePromoInfoTests.swift
//  AdguardMiniTests
//

import XCTest

import AppBackend

/// Covers mapping of a decoded backend promotion response into the paywall promo model.
final class PromotionResponsePromoInfoTests: XCTestCase {
    /// An inactive promotion inside its date window maps to no promo.
    func testReturnsNilWhenInactive() throws {
        let now = Date.now
        let response = try self.makeResponse(
            active: false,
            startDate: now.addingTimeInterval(-3600),
            endDate: now.addingTimeInterval(3600)
        )

        XCTAssertNil(response.toProto())
    }

    /// An active promotion whose start date has not arrived maps to no promo.
    func testReturnsNilBeforeStartDate() throws {
        let now = Date.now
        let response = try self.makeResponse(
            active: true,
            startDate: now.addingTimeInterval(3600),
            endDate: now.addingTimeInterval(7200)
        )

        XCTAssertNil(response.toProto())
    }

    /// An active promotion past its exclusive end date maps to no promo.
    func testReturnsNilAfterEndDate() throws {
        let now = Date.now
        let response = try self.makeResponse(
            active: true,
            startDate: now.addingTimeInterval(-7200),
            endDate: now.addingTimeInterval(-3600)
        )

        XCTAssertNil(response.toProto())
    }

    /// An active promotion inside its date window maps every field to the promo model.
    func testMapsFieldsWhenActual() throws {
        let now = Date.now
        let response = try self.makeResponse(
            active: true,
            startDate: now.addingTimeInterval(-3600),
            endDate: now.addingTimeInterval(3600),
            title: "Standalone promo",
            label: "50% off",
            buttonText: "Get discount",
            buttonUrl: "https://example.com/promo"
        )

        let promoInfo = try XCTUnwrap(response.toProto())
        XCTAssertEqual(promoInfo.title, "Standalone promo")
        XCTAssertEqual(promoInfo.subtitle, "50% off")
        XCTAssertEqual(promoInfo.buttonText, "Get discount")
        XCTAssertEqual(promoInfo.buttonURL, "https://example.com/promo")
    }

    /// Decodes a complete promotion XML fixture through the backend package initializer.
    private func makeResponse(
        active: Bool,
        startDate: Date,
        endDate: Date,
        title: String = "Promo title",
        label: String = "Promo label",
        buttonText: String = "Promo button",
        buttonUrl: String = "https://example.com/promo"
    ) throws -> AppBackend.PromotionResponse {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <PromotionResponse>
            <active>\(active)</active>
            <start-date>\(formatter.string(from: startDate))</start-date>
            <end-date>\(formatter.string(from: endDate))</end-date>
            <title>\(title)</title>
            <label>\(label)</label>
            <button-text>\(buttonText)</button-text>
            <button-url>\(buttonUrl)</button-url>
        </PromotionResponse>
        """

        return try AppBackend.PromotionResponse(data: Data(xml.utf8))
    }
}
