// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import type { IStoryFrame } from '../model';

/**
 * Special frame that is used to substitute a few frames at one place.
 */
export class SubstitutedStoryFrame implements IStoryFrame {
    private currentFrameIndex = 0;

    /**
     *
     */
    public get title() {
        return this.frames[this.currentFrameIndex]?.title;
    }

    /**
     *
     */
    public get description() {
        return this.frames[this.currentFrameIndex]?.description;
    }

    /**
     *
     */
    public get image() {
        return this.frames[this.currentFrameIndex]?.image;
    }

    /**
     *
     */
    public get actionButton() {
        return this.frames[this.currentFrameIndex]?.actionButton;
    }

    /**
     *
     */
    public get component() {
        return this.frames[this.currentFrameIndex]?.component;
    }

    /**
     *
     */
    public get frameId() {
        return this.frames[this.currentFrameIndex]?.frameId;
    }

    /**
     * Constructor
     *
     * @param frames Multiple frames to substitute
     */
    public constructor(public readonly frames: IStoryFrame[]) {}

    /**
     * Sets current substituted frame index
     *
     * @param index Frame index
     */
    public setIndex(index: number) {
        this.currentFrameIndex = index;
    }
}
