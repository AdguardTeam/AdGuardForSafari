// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

declare namespace Sciter.FS {
    type OpenFlags = 'a' | 'ax' | 'a+' | 'ax+' | 'as' | 'as+' | 'r' | 'r+' | 'rs+' | 'w' | 'wx' | 'w+' | 'wx+';

    function open(path: string, flags?: OpenFlags, mode?: number): Promise<FileHandle>;
    function readdir(path: string): Promise<Dir>;
    function readFile(path: string): Promise<ArrayBuffer>;

    type SelectFileParams = {
        mode: 'save' | 'open';
        filter?: string;
        extension?: string;
        caption: string;
        path: string;
    };

    type FileHandle = {
        read(): Promise<Uint8Array>;
        write(data: string | ArrayBuffer): Promise<{ result: number }>;
        close(): Promise<void>;
    };

    type Dir = {
        [Symbol.asyncIterator](): AsyncIterableIterator<{ name: string; type: number }>;
        close(): Promise<void>;
    };
}
