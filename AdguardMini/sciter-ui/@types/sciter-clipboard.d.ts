// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Clipboard data object
 */
type ClipboardDataObject = {
    text: string;
    html: string;
    json: any;
    file: string[];
    link: { caption: string; url: string };
    image: any;
};

/**
 * Clipboard interface
 */
declare type SystemClipboard = {
    read(): ClipboardDataObject;
    readText(): string;
    write(data: string): boolean;
    writeText(data: string): boolean;
    has(type: string): boolean;
};
