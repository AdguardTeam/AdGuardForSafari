// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * @file Safari extension types.
 */

// Define the interface for the message event
interface SafariExtensionMessageEvent {
    message: unknown;
    name: string;
}

// Declare the global safari namespace and its members
declare namespace safari {
    namespace self {
        /**
         * Adds an event listener for Safari messages.
         *
         * @param type The event type, which in this case is "message".
         * @param listener The handler that will be called with a SafariExtensionMessageEvent.
         */
        function addEventListener(
            type: 'message',
            listener: (event: SafariExtensionMessageEvent) => void
        ): void;
    }

    namespace extension {
        /**
         * Dispatches a message from the extension.
         *
         * @param name The name of the message.
         * @param userInfo Additional data to send with the message.
         */
        function dispatchMessage(
            name: string,
            userInfo?: unknown
        ): void;
    }
}
