// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { pathsMap } from "./sys";

/**
 * Opens link in new tab
 *
 * @param link
 */
export function launch(link: string): void {
    window.open(link);
}

/**
 * Env path for sciter
 *
 * @param pathKey
 */
export function path(pathKey: string): string {
    return pathsMap.get(pathKey) || '';
}
