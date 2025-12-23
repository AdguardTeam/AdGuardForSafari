// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import type { ColorTheme } from 'Utils/colorThemes';

export enum SciterWindowId {
    USER_RULE_EDITOR,
}

export type CreateWindowParams = {
    id: SciterWindowId;
    width: number;
    height: number;
    caption: string;
};

const PATH_TO_WEBVIEW_HTML = 'this://app/webview.html';

/**
 * Store that manages sciter-specific windowing functionality
 */
export class Windowing {
    private readonly openedWindows = new Set<SciterWindowId>();

    /**
     * Ctor
     */
    constructor() {
        makeAutoObservable(this, undefined, { autoBind: true });
    }

    /**
     * Set window opened state
     */
    public setWindowOpened(id: SciterWindowId, flag: boolean) {
        if (flag) {
            this.openedWindows.add(id);
        } else {
            this.openedWindows.delete(id);
        }
    }

    /**
     * Get window opened state
     */
    public getIsWindowOpened(id: SciterWindowId) {
        return this.openedWindows.has(id);
    }

    /**
     * Send event to the specified window
     */
    public sendEvent(windowId: SciterWindowId, eventName: string, eventPayload: any) {
        const window = this.findWindowByParam('id', windowId);
        if (window) {
            window.postEvent(new CustomEvent(eventName, { detail: eventPayload }));
        }
    }

    /**
     * Creates a sciter window
     */
    public createWindow(params: CreateWindowParams): SciterWindow {
        const { id, ...windowParams } = params;

        const newWindow = new window.SciterGlobal({
            ...windowParams,
            url: PATH_TO_WEBVIEW_HTML,
            parameters: { id },
            parent: window.SciterWindow,
        });

        this.setWindowOpened(id, true);
        this.focusWindow(id);

        return newWindow;
    }

    /**
     * Closes the sciter window
     */
    public closeWindow(windowId: SciterWindowId) {
        const window = this.findWindowByParam('id', windowId);
        if (window) {
            window.close();
            this.setWindowOpened(windowId, false);
        }
    }

    /**
     * Sets focus on the window
     */
    public focusWindow(windowId: SciterWindowId) {
        const window = this.findWindowByParam('id', windowId);
        if (window) {
            window.state = (Window as any).WINDOW_SHOWN;
            window.activate(true);
        }
    }

    /**
     * Finds window by parameter
     */
    public findWindowByParam(paramKey: string, paramValue: any): SciterWindow | undefined {
        return this.getAllWindows().find(({ parameters }: any) => parameters && parameters[paramKey] === paramValue);
    }

    /**
     * Retrieves all SciterWindow instances.
     * @returns {SciterWindow[]} An array of all SciterWindow instances.
     */
    private getAllWindows(): SciterWindow[] {
        return (Window as any).all;
    }

    /**
     * Updates the theme for all windows.
     * @param colorTheme - The color theme to set.
     */
    public updateTheme(colorTheme: ColorTheme) {
        this.getAllWindows()
            .forEach((sciterWindow) => sciterWindow.postEvent(new CustomEvent('theme', { detail: colorTheme })));
    }
}
