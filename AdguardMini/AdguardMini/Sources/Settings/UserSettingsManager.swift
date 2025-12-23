// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  UserSettingsManager.swift
//  AdguardMini
//

import Foundation

// MARK: - UserSettingsManager protocol

protocol UserSettingsManager: UserSettingsProtocol {
    var quitReaction: QuitReaction { get set }
    var currentUpdateChannel: String { get set }

    func registerUserDefaults(_ dict: [String: Any])
    func updatePersistentDomain(_ dict: [String: Any])
    func resetSettings()
}

// MARK: - UserSettingsManager class implementation

extension UserSettings: UserSettingsManager {
    private var preservedDict: [String: Any] {
        [
            SettingsKey.updateChannel.rawValue: self.currentUpdateChannel,
            SettingsKey.wasMigratedFromLegacyApp.rawValue: UserDefaults.standard.bool(
                forKey: SettingsKey.wasMigratedFromLegacyApp.rawValue
            )
        ]
    }

    var quitReaction: QuitReaction {
        get { QuitReaction(rawValue: self.quitOption) ?? .ask }
        set { self.quitOption = newValue.rawValue }
    }

    var currentUpdateChannel: String {
        get {
            if self.updateChannel.isEmpty {
                self.updateChannel = BuildConfig.AG_CHANNEL
            }
            return self.updateChannel
        }
        set {
            self.updateChannel = newValue
        }
    }

    func registerUserDefaults(_ dict: [String: Any]) {
        UserDefaults.standard.register(defaults: dict)
    }

    func updatePersistentDomain(_ dict: [String: Any]) {
        UserDefaults.standard.setPersistentDomain(
            dict.merging(self.preservedDict) { _, new in new },
            forName: BuildConfig.AG_APP_ID
        )
    }

    func resetSettings() {
        self.updatePersistentDomain(self.preservedDict)
    }
}
