// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  SafariExtension Builder
//

import Foundation
import AML

Logger.shared.handlers = [NSLogHandler()]

let args = ProcessInfo.processInfo.arguments
let fileManager = FileManager.default

var channel = "--release"
var preparedResourcesPath = fileManager.currentDirectoryPath

if args.count > 1 {
    channel = args[1]
}

if args.count > 2 {
    preparedResourcesPath = args[2]
}

// Update AdGuard Extra
guard let srcRoot = ProcessInfo.processInfo.environment["SRCROOT"] else {
    LogError("Cannot get SRCROOT for AdGuard Extra update")
    exit(1)
}

let isDebugChannel = channel == "--debug"
let forceAGExtraUpdate = !isDebugChannel

let extraScriptPath = "\(preparedResourcesPath)/adguard-extra.js"
let extraPlistPath = "\(srcRoot)/PopupExtension/Info.plist"

let extraUpdateRes = await updateAdGuardExtra(
    scriptPath: extraScriptPath,
    infoPlistPath: extraPlistPath,
    force: forceAGExtraUpdate
)

if !extraUpdateRes {
    LogError("Failed to update AdGuard Extra")
    exit(1)
}
