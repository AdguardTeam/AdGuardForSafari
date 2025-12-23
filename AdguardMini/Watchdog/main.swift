// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  main.swift
//  Watchdog
//

import Foundation

let argc = CommandLine.argc
let argv = CommandLine.arguments

if argc != 3 {
    exit(EXIT_FAILURE)
}

let executable = URL(fileURLWithPath: argv[1])
let ppid = Int32(argv[2])!

NSLog("Looking for \(executable.absoluteString) : \(ppid)")

let listener = TerminationListener(executable: executable, ppid: ppid)
RunLoop.current.run()
