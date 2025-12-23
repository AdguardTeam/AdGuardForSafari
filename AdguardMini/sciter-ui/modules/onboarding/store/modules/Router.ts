// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable } from 'mobx';

import type { OnboardingStore } from 'OnboardingStore';

export enum RouteName {
    onboarding = 'onboarding',
}

/**
 * Params map for current route
 */
export type RouterParams<Params extends Record<string, any> = Record<string, any>> = Params | undefined;

/**
 * Custom router
 */
export class Router {
    rootStore: OnboardingStore;

    /**
     * Current route
     */
    public currentPath: RouteName = RouteName.onboarding;

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
    public constructor(rootStore: OnboardingStore) {
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
    public changePath<Params extends Record<string, any>>(path: RouteName, params?: RouterParams<Params>) {
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
