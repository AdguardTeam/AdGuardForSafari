// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import { AppInfo as AppInfoEnt, EmptyValue } from 'Apis/types';

import type { SettingsStore } from 'SettingsStore';

const CHECK_UPDATES_INTERVAL = 60 * 1000;

/**
 *  AppInfo store
 */
export class AppInfo {
    rootStore: SettingsStore;

    /**
     * info about application
     */
    public appInfo = new AppInfoEnt();

    /**
     * Debouncer for update checking
     */
    private readonly lastTimeUpdate: number | undefined;

    /**
     * Bool describes if new version of application is available
     */
    public newVersionAvailable: boolean | undefined = false;

    /**
     * Ctor
     *
     * @param rootStore
     */
    public constructor(rootStore: SettingsStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, {
            rootStore: false,
        }, { autoBind: true });
    }

    /**
     * receive app info from sciter
     */
    public async getAppInfo() {
        const resp = await window.API.appInfoService.GetAbout(new EmptyValue());
        this.setAppInfo(resp);
    }

    /**
     * private setter for app info
     */
    private setAppInfo(info: AppInfoEnt) {
        this.appInfo = info;
    }

    /**
     * Start the process of checking version updates
     */
    public checkApplicationVersion() {
        if (Date.now() < (this.lastTimeUpdate || 0) + CHECK_UPDATES_INTERVAL) {
            return;
        }
        window.API.settingsService.CheckApplicationVersion(new EmptyValue());
    }

    /**
     * Set application update status
     */
    public setNewVersionAvailable(newVersionAvailable: boolean) {
        this.newVersionAvailable = newVersionAvailable;
    }

    /**
     * Request update of application
     */
    public async requestUpdate() {
        window.API.settingsService.RequestApplicationUpdate(new EmptyValue());
    }

    /**
     * Setter for updateAvailable field
     */
    public setUpdateAvailable(updateAvailable: boolean) {
        const appInfo = this.updateHelper();
        appInfo.updateAvailable = updateAvailable;
        this.setAppInfo(appInfo);
    }

    /**
     * Private update helper
     */
    private updateHelper() {
        return new AppInfoEnt({
            channel: this.appInfo.channel,
            dependencies: this.appInfo.dependencies,
            updateAvailable: this.appInfo.updateAvailable,
            version: this.appInfo.version,
        });
    }
}
