// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

export type Bytes = ArrayBufferLike;

type XCallCallback = (promiseResult: boolean, binary: ArrayBuffer) => void;

// @TODO: move to declarations?
export interface IAPI_CALL {
    xcall(methodName: string, binaryMessage: Bytes, callback: XCallCallback): Promise<Uint8Array>;
}

// @TODO: move to declarations?
declare class Window {
    public static this: IAPI_CALL;
}

/**
 * Sciter backend relay wrapper
 *
 * @param methodName
 * @param binaryParam
 */
export const xcall = async (methodName: string, binaryParam: Bytes): Promise<Uint8Array> => {
    return new Promise<Uint8Array>((resolve, reject) => {
        const callback = (promiseResult: boolean, binary: ArrayBuffer) => {
            if (promiseResult) {
                resolve(new Uint8Array(binary));
            } else {
                reject(new Error(`Call "${methodName} failed!"`));
            }
        };

        Window.this.xcall(methodName, binaryParam, callback);
    });
};
