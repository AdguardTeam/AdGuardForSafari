// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { clamp } from '@adg/sciter-utils-kit';

import { StoryNavigation, SubstitutedStoryFrame } from 'Modules/tray/modules/stories/classes';

enum NavigationType {
    NEXT = 'NEXT',
    PREV = 'PREV',
    SET_INDEX = 'SET_INDEX',
    SET_FRAME_BY_ID = 'SET_FRAME_BY_ID',
    RESET_FIRST_FRAME = 'RESET_FIRST_FRAME',
}

export const actions = {
    next: () => ({ type: NavigationType.NEXT } as const),
    prev: () => ({ type: NavigationType.PREV } as const),
    setIndex: (index: number) => ({ type: NavigationType.SET_INDEX, payload: index } as const),
    setFrameById: (id: string) => ({ type: NavigationType.SET_FRAME_BY_ID, payload: id } as const),
    resetFirstFrame: () => ({ type: NavigationType.RESET_FIRST_FRAME } as const),
};

export type NavigationUnion = ReturnType<(typeof actions)[keyof typeof actions]>;

/**
 * Frames navigation reducer
 *
 * @param state Current navigation state
 * @param action Navigation action
 * @returns New navigation state
 */
export function navigationReducer(state: StoryNavigation, action: NavigationUnion): StoryNavigation {
    switch (action.type) {
        case NavigationType.NEXT: {
            const next = new StoryNavigation(state.storyInfo);
            next.currentFrameIndex = state.currentFrameIndex + 1;
            return next;
        }
        case NavigationType.PREV: {
            const prev = new StoryNavigation(state.storyInfo);
            prev.currentFrameIndex = Math.max(0, state.currentFrameIndex - 1);
            if (prev.currentFrameIndex === 0) {
                prev.isFirstFrameReturnedBack = true;
            }
            return prev;
        }
        case NavigationType.SET_INDEX: {
            const set = new StoryNavigation(state.storyInfo);
            const max = state.storyInfo.frames.length - 1;
            set.currentFrameIndex = clamp(action.payload, 0, max);
            return set;
        }
        case NavigationType.SET_FRAME_BY_ID: {
            const set = new StoryNavigation(state.storyInfo);

            for (let storyIndex = 0; storyIndex < set.storyInfo.frames.length; storyIndex++) {
                const currentFrame = set.storyInfo.frames[storyIndex];
                if (currentFrame instanceof SubstitutedStoryFrame) {
                    const frameIndex = currentFrame.frames.findIndex((frame) => frame.frameId === action.payload);
                    if (frameIndex !== -1) {
                        set.setIndex(storyIndex);
                        currentFrame.setIndex(frameIndex);
                        return set;
                    }
                } else if (currentFrame.frameId === action.payload) {
                    set.setIndex(storyIndex);
                    return set;
                }
            }

            log.error(`[STORY: ${set.storyInfo.id}] Frame with id ${action.payload} not found`);

            return set;
        }
        case NavigationType.RESET_FIRST_FRAME: {
            const set = new StoryNavigation(state.storyInfo);
            return set;
        }
        default:
            return state;
    }
}
