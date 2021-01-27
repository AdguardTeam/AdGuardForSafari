//
//  BlockerEntry.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 29.06.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import Foundation

// Json decoded object description
struct BlockerEntry: Codable {
    var trigger: Trigger
    let action: Action

    struct Trigger : Codable {
        let ifDomain: [String]?
        let urlFilter: String?
        let unlessDomain: [String]?

        var shortcut: String?
        var regex: NSRegularExpression?

        enum CodingKeys: String, CodingKey {
            case ifDomain = "if-domain"
            case urlFilter = "url-filter"
            case unlessDomain = "unless-domain"
            case shortcut = "url-shortcut"
        }

        mutating func setShortcut(shortcutValue: String?) {
            self.shortcut = shortcutValue;
        }

        mutating func setRegex(regex: NSRegularExpression?) {
            self.regex = regex;
        }
    }

    struct Action : Codable {
        let type: String
        let cssExtended: String?
        let cssInject: String?
        let script: String?
        let scriptlet: String?
        let scriptletParam: String?

         enum CodingKeys: String, CodingKey {
            case type = "type"
            case cssExtended = "css-extended"
            case cssInject = "css-inject"
            case script = "script"
            case scriptlet = "scriptlet"
            case scriptletParam = "scriptletParam"
         }
    }
}
