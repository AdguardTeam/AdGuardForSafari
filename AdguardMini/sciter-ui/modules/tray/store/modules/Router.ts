// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import type { TrayStore } from 'TrayStore';

export enum RouteName {
    home = 'home',
    updates = 'updates',
    filters = 'filters',
}

/**
 * Params map for current route
 */
export type RouterParams<Params extends Record<string, any> = Record<string, any>> = Params | undefined;

/**
 * Custom router
 */
export class Router {
    rootStore: TrayStore;

    /**
     * Current route
     */
    public currentPath: RouteName = RouteName.home;

    /**
     * Current route params
     *
     * @protected
     */
    protected params: RouterParams;

    /**
     * Ctor
     *
     * @param rootStore
     */
    constructor(rootStore: TrayStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, {
            rootStore: false,
        }, { autoBind: true });
    }

    /**
     * Used for typescript casting
     */
    public getParams<Params>() {
        return this.params as Params | undefined;
    }

    /**
     * Change path with params
     *
     * @param path
     * @param params
     */
    public changePath(path: RouteName, params?: RouterParams) {
        log.dbg(`Router, navigate from ${this.currentPath} to ${path}`);

        this.params = params;
        this.currentPath = path;
    }

    /**
     * Used for the "key" prop in router
     */
    public getPathHash(): string {
        return this.currentPath + JSON.stringify(this.params);
    }
}
