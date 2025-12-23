// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import 'expose-loader?exposes=preactHooks!preact/hooks';
// eslint-disable-next-line import/order,import/no-unresolved
import 'SciterPolyfills';

import { render } from 'preact';
import { instantiateLogger, LogLevel } from '@adg/sciter-utils-kit';

// Default css styles (reset, colors, dark/light)...
import 'Theme/default';

import '../common/api';

import 'Modules/onboarding/lib/callbacks';

import { App } from './components/App';

window.log = instantiateLogger(FULL_LOGS, LogLevel.ERR);

window.SciterWindow.caption = 'AdGuard Mini';
// eslint-disable-next-line
// @ts-ignore
document.ready = () => {
    const node = document.getElementById('app')!;
    render(<App />, node);
};
