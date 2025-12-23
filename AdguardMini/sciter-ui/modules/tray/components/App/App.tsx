// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { createPortal } from 'preact/compat';

import { NotificationsRenderer } from '../NotificationsRenderer';
import { Router } from '../Router';

import './App.pcss';

const notifyContainer = document.getElementById('notify')!;

/**
 * App entry
 */
export function App() {
    return (
        <>
            <Router />
            {createPortal(<NotificationsRenderer />, notifyContainer)}
        </>
    );
}
