// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useCallback } from 'preact/hooks';

import { useTrayStore } from 'Modules/tray/lib/hooks';
import { Text, Icon } from 'UILib';

import s from './StoryCard.module.pcss';

import type { StoryCardIcon } from 'Modules/tray/modules/stories/model';
import type { TrayEvent } from 'Modules/tray/store/modules';

export type StoryCardProps = {
    warning?: boolean;
    icon: StoryCardIcon;
    text: string;
    storyIndex: number;
    setSelectedStoryIndex(index: number): void;
    className?: string;
    telemetryEvent?: TrayEvent;
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
    telemetryEvent,
}: StoryCardProps) {
    const { telemetry } = useTrayStore();

    const onClick = useCallback(() => {
        setSelectedStoryIndex(storyIndex);
        if (telemetryEvent) {
            telemetry.trackEvent(telemetryEvent);
        }
    }, [setSelectedStoryIndex, storyIndex, telemetry, telemetryEvent]);

    return (
        <div className={cx(s.StoryCard, warning && s.StoryCard__warning, className)} onClick={onClick}>
            <Icon className={cx(s.StoryCard_icon, warning && s.StoryCard_icon__warning)} icon={icon} big />
            <Text type="t2">{text}</Text>
        </div>
    );
}

export const StoryCard = observer(StoryCardComponent);
