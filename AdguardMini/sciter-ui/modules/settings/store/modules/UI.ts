// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import type { Subject } from 'Modules/settings/components/SupportContact';
import type { VNode, ComponentChild } from 'preact';
import type { SettingsStore } from 'SettingsStore';

/**
 * Tooltip show data
 */
type TooltipData = {
    coords: Vec2;
    renderTooltip(): ComponentChild | VNode | string;
};

/**
 * Type for save intermediate data of inputed by user in SupportContact
 */
type SupportContactFormData = {
    message: string;
    addLogs: boolean;
    theme: Subject;
    email: string;
};

/**
 * Store that manages UI settings
 */
export class UI {
    public rootStore: SettingsStore;

    public tooltipData: Nullable<TooltipData> = null;

    public supportContactFormData: Nullable<SupportContactFormData> = null;

    // Used in Safari protection page to show report problem button once open
    public reportProblemWasShown = false;

    /**
     *
     */
    constructor(rootStore: SettingsStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, {
            rootStore: false,
        });
    }

    /**
     * Update tooltip position
     * @param data Nullable<TooltipData>
     */
    public updateTooltip(data: Nullable<TooltipData>) {
        this.tooltipData = data;
    }

    /**
     * Setter for supportContactFormData
     * @param data SupportContactFormData
     */
    public setSupportContactFormData(data: SupportContactFormData | null) {
        this.supportContactFormData = data;
    }

    /**
     * Setter for reportProblemWasShown
     * @param show boolean, if ContextMenu was shown
     */
    public setReportProblemWasShown(show: boolean) {
        this.reportProblemWasShown = show;
    }
}
