// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FiltersConverter.swift
//  AdguardMini
//

import Foundation
import ContentBlockerConverter
import SafariServices
import AML

// MARK: - FiltersConverter

protocol FiltersConverter {
    func convertArray(rules: [String], isAdvancedBlocking: Bool, progress: Progress) -> ConversionResult
}

// MARK: - FiltersConverterImpl

final class FiltersConverterImpl {
    // MARK: Private properties

    private let converter: ContentBlockerConverter

    // MARK: Init

    init(converter: ContentBlockerConverter) {
        self.converter = converter
    }
}

// MARK: - FiltersConverter implementation

extension FiltersConverterImpl: FiltersConverter {
    func convertArray(rules: [String], isAdvancedBlocking: Bool, progress: Progress) -> ConversionResult {
        self.converter.convertArray(
            rules: rules,
            safariVersion: SafariVersion.autodetect(),
            advancedBlocking: isAdvancedBlocking,
            progress: progress
        )
    }
}
