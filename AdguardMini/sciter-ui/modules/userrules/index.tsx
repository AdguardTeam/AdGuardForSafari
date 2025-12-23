// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import 'expose-loader?exposes=preactHooks!preact/hooks';

// Default css styles (reset, colors, dark/light)...
import 'Theme/default';

import { render } from 'preact';

import { App } from './App';
import './reset.css';

const node = document.getElementById('app')!;
render(<App />, node);
