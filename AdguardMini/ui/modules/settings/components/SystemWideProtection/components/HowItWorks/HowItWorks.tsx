// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { Text } from 'UILib';

import s from './HowItWorks.module.pcss';

/**
 * How It Works component for System-wide Protection settings page
 */
export function HowItWorks() {
    return (
        <div className={s.HowItWorks_block}>
            <Text className={s.HowItWorks_block_title} type="h5">
                {translate('advanced.blocking.system.wide.part.how')}
            </Text>
            <Text type="t1" wide>
                {translate('advanced.blocking.system.wide.part.how.desc')}
            </Text>
        </div>
    );
}
