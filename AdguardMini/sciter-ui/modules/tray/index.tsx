// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import 'expose-loader?exposes=preactHooks!preact/hooks';
// eslint-disable-next-line import/order,import/no-unresolved
import 'SciterPolyfills';

import { render } from 'preact';
import { instantiateLogger } from '@adg/sciter-utils-kit';

// Default css styles (reset, colors, dark/light)...
import 'Theme/default';
import 'Common/api';
import 'Modules/tray/lib/callbacks';

import { App } from './components/App';

window.log = instantiateLogger(FULL_LOGS);

// eslint-disable-next-line
// @ts-ignore
document.ready = () => {
    const node = document.getElementById('app')!;
    render(<App />, node);
};
