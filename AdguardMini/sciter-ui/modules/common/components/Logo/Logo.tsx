// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'preact/hooks';

import { Icon } from 'UILib';
import { isDarkColorTheme } from 'Utils/colorThemes';

import s from './Logo.module.pcss';

import type { UseColorTheme } from 'Utils/colorThemes';

export type LogoProps = {
    useTheme: UseColorTheme;
    className?: string;
};

/**
 * AdGuard Mini logo
 */
export function Logo({ useTheme, className }: LogoProps) {
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    useTheme((theme) => {
        setIsDarkTheme(isDarkColorTheme(theme));
    });

    return (
        <div className={cx(s.Logo, className)}>
            <Icon className={s.Logo_logoIcon} icon={isDarkTheme ? 'logo_dark' : 'logo'} />
        </div>
    );
}
