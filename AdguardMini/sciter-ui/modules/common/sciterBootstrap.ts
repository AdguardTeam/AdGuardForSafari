// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later
// @ts-nocheck

/**
 * This needs for sync sciter and browser environments, especially for in-browser tests.
 */
function sciterBootstrap({ sys, sciter, debug, env }) {
    window.log = {
        info: console.log,
        dbg: console.log,
        error: console.log,
    };
    window.FS = sys.fs;
    window.decode = sciter.decode;
    window.setUnhandledExeceptionHandler = debug.setUnhandledExeceptionHandler;
    window.GenerateUuid = sciter.uuid;
    window.splitPath = sys.fs.splitpath;
    Object.defineProperties(window, {
        platform: {
            value: env.PLATFORM,
        },
        SystemClipboard: {
            value: Clipboard,
        },
    });
    window.OpenLinkInBrowser = env.launch;
    window.SciterWindow = Window.this;
    window.WindowProperties = Window;
    window.SciterGlobal = Window;
    window.ApplicationsPath = env.path('applications');
    window.DocumentsPath = env.path('documents');
    document.on('^click', 'a[href]', (evt, a) => {
        evt.stopPropagation();
        const href = a.getAttribute('href');
        window.OpenLinkInBrowser(href); // open browser
    });
}

export default sciterBootstrap;
