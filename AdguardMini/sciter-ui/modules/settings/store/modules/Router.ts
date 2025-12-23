// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import type { SettingsStore } from 'SettingsStore';

export enum RouteName {
    safari_protection = 'safari_protection',
    language_specific = 'language_specific',
    advanced_blocking = 'advanced_blocking',
    user_rules = 'user_rules',
    user_rule = 'user_rule',
    settings = 'settings',
    safari_extensions = 'safari_extensions',
    filters = 'filters',
    license = 'license',
    support = 'support',
    contact_support = 'contact_support',
    about = 'about',
    quit_reaction = 'quit_reaction',
}

/**
 * Params map for current route
 */
export type RouterParams<Params extends Record<string, any> = Record<string, any>> = Params | undefined;

/**
 * Custom router
 */
export class Router {
    rootStore: SettingsStore;

    /**
     * Current route
     */
    public currentPath: RouteName = RouteName.safari_protection;

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
    public constructor(rootStore: SettingsStore) {
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
