// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  AdguardMini Prebuilder
//

import Foundation
import AML

Logger.shared.handlers = [NSLogHandler()]

if !processUserDefaults() {
    LogError("Failed to process user defaults")
    exit(1)
}

// Generate ThirdPartyDeps.swift
let fileManager = FileManager.default

guard let generatedFilesDir = ProcessInfo.processInfo.environment["AGP_GENERATED_FILES_DIR"] else {
    LogError("AGP_GENERATED_FILES_DIR not set")
    exit(1)
}

if !fileManager.fileExists(atPath: generatedFilesDir) {
    do {
        try fileManager.createDirectory(atPath: generatedFilesDir, withIntermediateDirectories: true)
    } catch {
        LogError("Failed to create generated files directory: \(error)")
        exit(1)
    }
}

guard let thirdPartyDepsPath = ProcessInfo.processInfo.environment["AGP_GENERATED_THIRD_PARTY_DEPS_FILE"],
      let preparedResourcesPath = ProcessInfo.processInfo.environment["AGP_PREPARED_RESOURCES_DIR"] else {
    LogError("Required environment variables not set")
    exit(1)
}

let thirdPartyDepsRes = generateThirdPartyDeps(
    preparedResourcesPath: preparedResourcesPath,
    outputPath: thirdPartyDepsPath
)

if !thirdPartyDepsRes {
    LogError("Failed to generate ThirdPartyDeps.swift")
    exit(1)
}

exit(0)
