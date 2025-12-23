// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import theme from 'Theme';
import { Button } from 'UILib';

import { ProgressBarElement } from '../ProgressBarElement/ProgressBarElement';

import s from './ProgressBarGroup.module.pcss';

type ProgressBarGroupProps = {
    framesCount: number;
    currentFrameIndex: number;
    onFrameClick(index: number): void;
    onClose(): void;
    isFirstFrameReturnedBack: boolean;
};

/**
 * Progress bar component for story constructor
 */
export function ProgressBarGroup({
    framesCount,
    currentFrameIndex,
    onFrameClick,
    onClose,
    isFirstFrameReturnedBack,
}: ProgressBarGroupProps) {
    const framesRunner = Array.from({ length: framesCount }, (_, index) => index);

    return (
        <div className={s.ProgressBar}>
            {framesRunner.map((frameIndex) => (
                <ProgressBarElement
                    key={frameIndex}
                    currentFrameIndex={currentFrameIndex}
                    frameIndex={frameIndex}
                    isFirstFrameReturnedBack={isFirstFrameReturnedBack}
                    onFrameClick={onFrameClick}
                />
            ))}
            <Button
                className={s.ProgressBar_close}
                icon="cross"
                iconClassName={theme.button.whiteIcon}
                type="icon"
                onClick={onClose}
            />
        </div>
    );
}
