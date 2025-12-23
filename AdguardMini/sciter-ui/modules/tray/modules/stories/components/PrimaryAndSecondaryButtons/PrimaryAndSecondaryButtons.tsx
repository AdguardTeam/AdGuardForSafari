// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import theme from 'Theme';
import { Button, Text } from 'UILib';

import s from './PrimaryAndSecondaryButtons.module.pcss';

/**
 * Shows primary and secondary buttons
 */
export function PrimaryAndSecondaryButtons({
    primaryButtonTitle,
    primaryButtonAction,
    secondaryButtonTitle,
    secondaryButtonAction,
}: {
    primaryButtonTitle: string;
    primaryButtonAction(): void;
    secondaryButtonTitle: string;
    secondaryButtonAction(): void;
}) {
    return (
        <>
            <Button
                className={cx(s.PrimaryAndSecondaryButtons_button, theme.button.storyButton)}
                type="submit"
                onClick={primaryButtonAction}
            >
                <Text lineHeight="none" type="t1" semibold>{primaryButtonTitle}</Text>
            </Button>
            <Button
                className={cx(s.PrimaryAndSecondaryButtons_buttonText, tx.button.textButton)}
                type="text"
                onClick={secondaryButtonAction}
            >
                <Text lineHeight="none" type="t1">{secondaryButtonTitle}</Text>
            </Button>
        </>
    );
}
