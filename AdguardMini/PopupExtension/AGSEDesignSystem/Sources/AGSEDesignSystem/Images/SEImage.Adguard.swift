// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SEImage.Adguard.swift
//  AGSEDesignSystem
//

import SwiftUI

// MARK: - SEImage.Adguard

extension SEImage {
    public enum Adguard {
        private static let path = ImageResource.Adguard.self

        static let logo = Image(path.logoAdguard)
        public static let thinkingAgnar = Image(path.thinkingAgnar)
        public static let thumbsUpAgnar = Image(path.agnarThumbsUp)
    }
}

// MARK: - SEImageAdguard_Previews

struct SEImageAdguard_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            SEImage.Adguard.logo
            SEImage.Adguard.thinkingAgnar
            SEImage.Adguard.thumbsUpAgnar
        }
        .padding(16)
    }
}
