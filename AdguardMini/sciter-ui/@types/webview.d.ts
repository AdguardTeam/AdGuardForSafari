// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import type React from 'preact/compat';

type HTMLWebViewElement = Record<string, any>;

// Sciter webview attributes
interface WebViewHTMLAttributes<T> extends React.HTMLAttributes<T> {
    allowWindowOpen: 'nopopup' | string;
    src?: string | undefined;
}

declare module 'preact' {
    export namespace JSX {
        export interface IntrinsicElements {
            webview: React.DetailedHTMLProps<WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;
        }
    }
}

export {};
