// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  FLMTypes+Sendable.swift
//  AdguardMini
//

import FLM

// MARK: - Sendable conformances

/// FLM's value types are value-type wrappers around protobuf messages, copied
/// across `Task` boundaries in `FiltersSupervisor`; the package builds in
/// Swift 5 mode and declares no `Sendable` conformance, so the conformances
/// are declared here and `@retroactive` records that the package owns the
/// types.
extension FilterInfo: @retroactive @unchecked Sendable {}
extension ActiveFilterInfo: @retroactive @unchecked Sendable {}
extension FilterGroup: @retroactive @unchecked Sendable {}
extension FilterMetadata: @retroactive @unchecked Sendable {}
extension FilterRule: @retroactive @unchecked Sendable {}
extension FilterTag: @retroactive @unchecked Sendable {}
