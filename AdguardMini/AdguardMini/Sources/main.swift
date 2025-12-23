// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  AdguardMini
//

import Cocoa
import AML

AppLogConfig.setup()

let appDelegate = AppDelegate()

NSApplication.shared.delegate = appDelegate

_ = NSApplicationMain(CommandLine.argc, CommandLine.unsafeArgv)
