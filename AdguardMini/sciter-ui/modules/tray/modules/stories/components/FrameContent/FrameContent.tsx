// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useCallback } from 'preact/hooks';

import theme from 'Theme';
import { Button, Text } from 'UILib';

import s from './FrameContent.module.pcss';

import type { IStoryFrame } from 'Modules/tray/modules/stories/model';

export type FrameContentProps = {
    frame: IStoryFrame;
    storyActionButtonHandle(): void;
    isMASReleaseVariant: boolean;
};

/**
 * Represents content of story frame
 */
export function FrameContent({ frame, storyActionButtonHandle, isMASReleaseVariant }: FrameContentProps) {
    const { title, description, image, actionButton, component: Component } = frame;

    const handleAction = useCallback(() => {
        storyActionButtonHandle();
        if (actionButton) {
            actionButton.action();
        }
    }, [storyActionButtonHandle, actionButton]);

    return (
        <>
            <div className={cx(s.FrameContent_image, s[image])} />
            <div>
                <Text className={s.FrameContent_title} type="h4">{title}</Text>
                <Text className={s.FrameContent_description} type="t1">{description}</Text>
            </div>
            {actionButton && (
                <Button className={cx(s.FrameContent_button, theme.button.storyButton)} type="submit" onClick={handleAction}>
                    <Text lineHeight="none" type="t1" semibold>{actionButton.title}</Text>
                </Button>
            )}
            {Component && (
                <Component isMASReleaseVariant={isMASReleaseVariant} />
            )}
            <div className={s.FrameContent_bottom} />
        </>
    );
}
