// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useCallback, useEffect, useRef } from 'preact/hooks';

import { useTrayStore } from 'Modules/tray/lib/hooks';

import type { StoryId } from 'Modules/tray/modules/stories/model';
import type { VNode } from 'preact';

type FlushCompletedStoriesProps = {
    children(props: { addCompletedStory(storyId: StoryId): void }): VNode;
};

/**
 * Component that flushes completed stories on unmount
 */
export function FlushCompletedStories({ children }: FlushCompletedStoriesProps) {
    const { settings } = useTrayStore();

    const completedStoriesRef = useRef<StoryId[]>([]);

    const onStoryCompleted = useCallback((storyId: StoryId) => {
        completedStoriesRef.current.push(storyId);
    }, []);

    useEffect(() => {
        // Save new order only on unmount
        return () => {
            completedStoriesRef.current.forEach((storyId) => {
                settings.setCompletedStory(storyId);
            });
        };
    }, []);

    return children({ addCompletedStory: onStoryCompleted });
}
