// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

// @ts-nocheck
import * as env from './env'
import * as debug from './debug'
import * as sys from './sys'
import * as sciter from './sciter'
import './sciterWebSetup'
import sciterBootstrap from '../../modules/common/sciterBootstrap';

const windowProperties = Object.freeze({
    WINDOW_HIDDEN: 'WINDOW_HIDDEN',
    WINDOW_SHOWN: 'WINDOW_SHOWN',
    WINDOW_FULL_SCREEN: 'WINDOW_FULL_SCREEN',
    WINDOW_MINIMIZED: 'WINDOW_MINIMIZED',
    WINDOW_MAXIMIZED: 'WINDOW_MAXIMIZED'
});

Object.defineProperties(Window, {
    WindowProperties: {
        value: windowProperties,
        enumerable: true
    }
});

/**
 * Configure Window.this properties
 */
let window_state = 'WINDOW_SHOWN';
Window['SciterWindow'] = Window['this'] = Object.defineProperties({}, {
    state: {
        set(v) {
            window_state = v;
        },
        get() {
            return window_state;
        }
    },
    selectFile: {
        value: function SciterSelectFile(...args) {
            console.log(`[${SciterSelectFile.name}]=> ${JSON.stringify(args)}`)
            // @TODO: save?
            return '';
        }
    },
    box: {
        value: function () {
            return {
                height: 683,
            }
        }
    }
});

const readyHandle = { lastHandle: null };
Object.defineProperties(document, {
    on: {
        value: function DocumentEventHandler(event, selector, cb) {
            const preparedEvent = event.replace(/[^a-z_-]+/i, '');
            if (preparedEvent) {
                document.addEventListener(preparedEvent, function (evt) {
                    // @TODO: matches?
                    if (evt.target.matches(selector)) {
                        cb.call(this, evt, this);
                    }
                }, true);
            }
        }
    },
    attributes: {
        value: new Proxy({}, {
            get(target, prop) {
                return document.documentElement.getAttribute(prop);
            }
        })
    },
    ready: {
        set(value) {
            if (readyHandle.lastHandle) {
                document.removeEventListener('DOMContentLoaded', readyHandle.lastHandle);
            }

            document.addEventListener('DOMContentLoaded', value);
            readyHandle.lastHandle = value;
        },
        get() {
            return readyHandle.lastHandle;
        }
    }
});

// TODO: selectRange polyfill
HTMLInputElement.prototype.edit = {
    selectRange() {
        return;
    }
}

sciterBootstrap({ sys, sciter, debug, env });
