// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserRulesImportDecision.swift
//  AdguardMini
//

import ProtoSchema

/// The outcome of reading and validating user-rules text from a user-selected
/// file.
enum UserRulesImportDecision {
    /// The text fits the import cap and may be persisted.
    case save(String)
    /// The file could not be read; the associated value is the reader's error.
    case unreadable(Error)
    /// The text is larger than the import cap allows.
    case overCap
    /// The path is outside the directories the app may read.
    case notConfined

    /// Resolves the decision for one loaded import payload.
    /// - Parameter result: The outcome of reading the user-selected file.
    /// - Returns: `.save` with the file text, `.unreadable` with the reader's
    ///   error, or `.overCap` when the text exceeds the import cap.
    static func make(_ result: Result<String, Error>) -> UserRulesImportDecision {
        switch result {
        case .failure(let error):
            return .unreadable(error)
        case .success(let text):
            return UserRulesValidator.isImportAllowed(content: text) ? .save(text) : .overCap
        }
    }

    /// Resolves the decision for one import attempt.
    /// - Parameters:
    ///   - isConfined: Whether the renderer-supplied path may be read.
    ///   - load: Reads the text of the confined file.
    /// - Returns: `.notConfined` when the path check fails, otherwise the
    ///   decision for the loaded text.
    static func make(
        isConfined: Bool,
        load: () async -> Result<String, Error>
    ) async -> UserRulesImportDecision {
        guard isConfined else {
            return .notConfined
        }
        return Self.make(await load())
    }

    /// Resolves the bridge reply for this decision.
    /// - Parameter currentRules: Reads the rules to reply with after a save.
    /// - Returns: The imported rules for `.save`, otherwise the failure reply.
    func reply(currentRules: () async -> UserRules) async -> UserRulesOrError {
        switch self {
        case .save:
            return UserRulesOrError(userRules: await currentRules())
        case .unreadable, .overCap, .notConfined:
            return .importError
        }
    }
}
