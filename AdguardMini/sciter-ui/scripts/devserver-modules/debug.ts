// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Sciter exception handler
 *
 * @param args
 */
export function setUnhandledExeceptionHandler(...args: any[]) {
  console.log(...args);
}
