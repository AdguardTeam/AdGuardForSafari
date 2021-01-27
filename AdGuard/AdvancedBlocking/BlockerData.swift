//
//  BlockerData.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 29.06.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import Foundation

// Wrapper result class
class BlockerData: Encodable {
    var scripts = [String]()
    var css = [String]()
    var cssExtended = [String]()
    var cssInject = [String]()
    var scriptlets = [String]()

    func addScript(script: String?) {
        if (script != nil && script != "") {
            scripts.append(script!);
        }
    }

    func addCss(style: String?) {
        if (style != nil && style != "") {
            css.append(style!);
        }
    }

    func addCssExtended(style: String?) {
        if (style != nil && style != "") {
            cssExtended.append(style!);
        }
    }

    func addCssInject(style: String?) {
        if (style != nil && style != "") {
            cssInject.append(style!);
        }
    }

    func addScriptlet(scriptlet: String?) {
        if (scriptlet != nil && scriptlet != "") {
            scriptlets.append(scriptlet!);
        }
    }

    func clear() {
        scripts = [];
        css = [];
        cssExtended = [];
        cssInject = [];
        scriptlets = [];
    }
}
