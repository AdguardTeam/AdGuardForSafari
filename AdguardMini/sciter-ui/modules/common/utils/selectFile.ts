// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Sciter selectFile wrapper
 *
 * @param writeMode  Write or read
 * @param extension  Default file extension, "html"
 * @param title      Title of dialog, "Save As"
 * @param initialDir Initial directory
 * @param onSuccess  Callback which fires on success path selection. If path === null, it will ignored
 */
export async function selectFile(
    writeMode: boolean,
    extension: string | undefined,
    title: string,
    initialDir: string,
    onSuccess: (path: string) => Promise<unknown>,
) {
    const path = window.SciterWindow.selectFile({
        mode: writeMode ? 'save' : 'open',
        filter: extension,
        caption: title,
        // For window import need slash at the end
        path: (!writeMode && initialDir.slice(-1) !== '/') ? `${initialDir}/` : initialDir,
    });

    if (!path) {
        return;
    }

    return onSuccess(decodeURIComponent(path.replace('file://', '')));
}
