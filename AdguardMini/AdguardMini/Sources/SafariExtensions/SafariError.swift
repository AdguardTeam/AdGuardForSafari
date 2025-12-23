// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariError.swift
//  AdguardMini
//

import SafariServices

enum SafariError: Error {
    case noExtensionFound
    case noAttachmentFound
    case loadingInterrupted
    case unknown(NSError)

    init(_ error: Error) {
        let err = error as NSError
        if err.domain == SFErrorDomain,
           let code = SFErrorCode(rawValue: err.code) {
            self = switch code {
            case .noExtensionFound:   .noExtensionFound
            case .noAttachmentFound:  .noAttachmentFound
            case .loadingInterrupted: .loadingInterrupted
            @unknown default:         .unknown(err)
            }
        } else {
            self = .unknown(err)
        }
    }
}
