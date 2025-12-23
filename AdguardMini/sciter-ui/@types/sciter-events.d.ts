// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

interface HTMLElementEventMap {
    '^exec:edit:paste': CustomEvent;
}

interface DocumentEventMap extends GlobalEventHandlersEventMap {
    /**
     * Window closure requested.
     *
     * JS code can prevent window closure by the user by calling event.preventDefault():
     */
    closerequest: CustomEvent & { reason: number; cancel: boolean };
}

interface MouseEvent {
    data?: { x?: number; y?: number } | undefined;
}
