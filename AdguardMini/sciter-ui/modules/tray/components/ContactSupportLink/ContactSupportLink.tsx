// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';

import { EmptyValue, StringValue } from 'Apis/types';
import { RouteName as SettingsRouteName } from 'SettingsStore/modules';
import { Button } from 'UILib';

import styles from './ContactSupportLink.module.pcss';

export type ContactSupportLinkProps = {
    text: string;
    onClick?(): void;
    className?: string;
};

/**
 * Renders a link that redirects to the contact support screen on click.
 */
function ContactSupportLinkComponent({ text, onClick, className }: ContactSupportLinkProps) {
    return (
        <Button
            className={cx(styles.ContactSupportLink, className)}
            type="text"
            onClick={(e) => {
                e?.stopPropagation();
                onClick?.();
                API.internalService.OpenSettingsWindow(new EmptyValue());
                API.settingsService.RequestOpenSettingsPage(
                    new StringValue({
                        value: SettingsRouteName.contact_support,
                    }),
                );
            }}
        >
            {text}
        </Button>
    );
}

export const ContactSupportLink = observer(ContactSupportLinkComponent);
