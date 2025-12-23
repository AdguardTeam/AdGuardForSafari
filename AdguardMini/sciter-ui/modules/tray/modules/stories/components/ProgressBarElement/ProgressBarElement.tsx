// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useCallback, useEffect, useRef } from 'preact/hooks';

import { getErrorMessage } from 'Modules/common/utils/error';

import s from './ProgressBarElement.module.pcss';

type ProgressBarElementProps = {
    frameIndex: number;
    currentFrameIndex: number;
    onFrameClick(index: number): void;
    isFirstFrameReturnedBack: boolean;
};

/**
 * Animation duration for progress bar element
 */
export const STORY_ANIMATION_DURATION = 5000;

/**
 * One progress bar element
 */
export function ProgressBarElement({
    frameIndex,
    currentFrameIndex,
    onFrameClick,
    isFirstFrameReturnedBack,
}: ProgressBarElementProps) {
    const onClick = useCallback(() => onFrameClick(frameIndex), [frameIndex, onFrameClick]);
    const barRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const barElement = barRef.current;
            if (!barElement) {
                return;
            }

            // Cancel any existing animation
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            if (frameIndex === currentFrameIndex) {
                const startTime = Date.now();

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / STORY_ANIMATION_DURATION, 1);

                    barElement.style.width = `${progress * 100}%`;

                    if (progress < 1) {
                        animationRef.current = requestAnimationFrame(animate);
                    } else {
                        animationRef.current = null;
                    }
                };

                barElement.style.width = '0%';
                animationRef.current = requestAnimationFrame(animate);
            } else if (frameIndex < currentFrameIndex) {
                barElement.style.width = '100%';
            } else {
                barElement.style.width = '0%';
            }

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }
            };
        } catch (error) {
            log.error(getErrorMessage(error, 'Failed to animate progress bar'));
        }
    }, [frameIndex, currentFrameIndex, isFirstFrameReturnedBack]);

    return (
        <div className={s.ProgressBarElement} onClick={onClick}>
            <div ref={barRef} className={s.ProgressBarElement_bar} />
        </div>
    );
}
