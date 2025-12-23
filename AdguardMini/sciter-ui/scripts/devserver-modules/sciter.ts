// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { v4 } from 'uuid'

/**
 * Decode mock
 *
 * @param str
 */
export function decode(str: string): string {
    return str;
}

export function uuid(): string {
    return v4();
}
