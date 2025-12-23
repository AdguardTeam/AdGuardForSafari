/**
 * @file Handles delaying and dispatching of DOMContentLoaded and load events.
 * 
 * SPDX-FileCopyrightText: AdGuard Software Limited
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { log } from './logger';

/**
 * The interceptors delay the events until either a response is received or the
 * timeout expires. If the events have already fired, no interceptors are added.
 *
 * @param timeout - Timeout in milliseconds after which the events are forced
 *                  (if not already handled).
 * @returns A function which, when invoked, cancels the timeout and dispatches
 *         (or removes) the interceptors.
 */
export function setupDelayedEventDispatcher(timeout = 100): () => void {
    interface Interceptor {
        name: string;
        options: EventInit;
        intercepted: boolean;
        listener: EventListener;
        target: EventTarget;
    }

    const interceptors: Interceptor[] = [];
    const events = [
        {
            name: 'DOMContentLoaded',
            options: { bubbles: true, cancelable: false },
            target: document,
        },
        {
            name: 'load',
            options: { bubbles: false, cancelable: false },
            target: window,
        },
    ];

    events.forEach((ev) => {
        const interceptor: Interceptor = {
            name: ev.name,
            options: ev.options,
            intercepted: false,
            target: ev.target,
            listener: (event: Event) => {
                // Prevent immediate propagation.
                event.stopImmediatePropagation();
                interceptor.intercepted = true;

                log(`${ev.name} event has been intercepted.`);
            },
        };
        interceptors.push(interceptor);

        interceptor.target.addEventListener(ev.name, interceptor.listener, { capture: true });
    });

    let dispatched = false;
    const dispatchEvents = (trigger: string) => {
        if (dispatched) return;
        dispatched = true;
        interceptors.forEach((interceptor) => {
            // Remove the interceptor listener.
            interceptor.target.removeEventListener(interceptor.name, interceptor.listener, { capture: true });
            if (interceptor.intercepted) {
                // If intercepted, dispatch the event manually so downstream listeners eventually receive it.
                const newEvent = new Event(interceptor.name, interceptor.options);
                interceptor.target.dispatchEvent(newEvent);

                const targetName = interceptor.target === document ? 'document' : 'window';
                log(`${interceptor.name} event re-dispatched due to ${trigger} on ${targetName}.`);
            } else {
                log(`Interceptor for ${interceptor.name} removed due to ${trigger}.`);
            }
        });
    };

    // Set a timer to automatically dispatch the events after the timeout.
    const timer = setTimeout(() => {
        dispatchEvents('timeout');
    }, timeout);

    // Return a function to cancel the timer and dispatch events immediately.
    return () => {
        clearTimeout(timer);
        dispatchEvents('response received');
    };
}
