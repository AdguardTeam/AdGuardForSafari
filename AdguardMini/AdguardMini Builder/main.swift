// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  AdguardMini Builder
//

import Foundation
import AML

Logger.shared.handlers = [NSLogHandler()]

let args = ProcessInfo.processInfo.arguments
let fileManager = FileManager.default

var productPath = fileManager.currentDirectoryPath
var channel = "--release"

if args.count > 1 {
    channel = args[1]
}

if args.count > 2 {
    productPath = args[2]
}

let filtersFolderPath = productPath.appendingPathComponent(BuildConfig.AG_DEFAULT_FILTERSDB_DIRNAME)

if !fileManager.fileExists(atPath: filtersFolderPath) {
    do {
        try fileManager.createDirectory(atPath: filtersFolderPath, withIntermediateDirectories: true)
    } catch {
        LogError("Failed to created filters DB folder: \(error)")
        exit(1)
    }
}

let isDebugChannel = channel == "--debug"
let forceFDBUpdate = !isDebugChannel

let updateRes = updateFiltersDb(inDirectory: filtersFolderPath, force: forceFDBUpdate)

if !updateRes {
    LogError("Failed to create default filter databases")
    exit(1)
}
