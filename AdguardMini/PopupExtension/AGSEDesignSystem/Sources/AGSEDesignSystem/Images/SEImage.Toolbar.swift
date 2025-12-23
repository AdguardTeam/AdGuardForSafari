// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEImage.Toolbar.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - SEImage.Toolbar

extension SEImage {
    public enum Toolbar {
        private static let path = "Icons/Toolbar"

        static let toolbarOn = Image("\(path)/toolbar-on", bundle: .module)
        static let toolbarOff = Image("\(path)/toolbar-off", bundle: .module)

        public static let nsToolbarOn: NSImage = Bundle.module.image(forResource: "\(path)/toolbar-on") ?? NSImage(size: .zero)
        public static let nsToolbarOff: NSImage = Bundle.module.image(forResource: "\(path)/toolbar-off") ?? NSImage(size: .zero)
    }
}

// MARK: - SEImageToolbar_Previews

struct SEImageToolbar_Previews: PreviewProvider {
    static var previews: some View {
        HStack {
            SEImage.Toolbar.toolbarOn
            SEImage.Toolbar.toolbarOff
        }
        .padding(16)
    }
}
