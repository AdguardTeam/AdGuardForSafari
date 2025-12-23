// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useCallback } from 'preact/hooks';

import { Text, Icon } from 'UILib';

import s from './StoryCard.module.pcss';

import type { StoryCardIcon } from 'Modules/tray/modules/stories/model';

export type StoryCardProps = {
    warning?: boolean;
    icon: StoryCardIcon;
    text: string;
    storyIndex: number;
    setSelectedStoryIndex(index: number): void;
    className?: string;
};

/**
 * Story card component
 */
function StoryCardComponent({
    warning,
    icon,
    text,
    storyIndex,
    setSelectedStoryIndex,
    className,
}: StoryCardProps) {
    const onClick = useCallback(() => setSelectedStoryIndex(storyIndex), [setSelectedStoryIndex, storyIndex]);

    return (
        <div className={cx(s.StoryCard, warning && s.StoryCard__warning, className)} onClick={onClick}>
            <Icon className={cx(s.StoryCard_icon, warning && s.StoryCard_icon__warning)} icon={icon} big />
            <Text type="t2">{text}</Text>
        </div>
    );
}

export const StoryCard = observer(StoryCardComponent);
