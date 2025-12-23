// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';

import { useSettingsStore } from 'SettingsLib/hooks';
import { RouteName } from 'SettingsStore/modules';

import { About } from '../About';
import { AdvancedBlocking } from '../AdvancedBlocking';
import { Filters } from '../Filters';
import { LanguageSpecific } from '../LanguageSpecific';
import { License } from '../License';
import { QuitReaction } from '../QuitReaction';
import { SafariExtension } from '../SafariExtension';
import { SafariProtection } from '../SafariProtection';
import { Settings } from '../Settings';
import { Support } from '../Support';
import { SupportContact } from '../SupportContact';
import { UserRule } from '../UserRule';
import { UserRules } from '../UserRules';

/**
 * Component for handling Routes. Depending on RouterStore display current page
 */
function RouterComponent() {
    const { router } = useSettingsStore();
    switch (router.currentPath) {
        case RouteName.safari_protection:
            return <SafariProtection />;
        case RouteName.language_specific:
            return <LanguageSpecific />;
        case RouteName.advanced_blocking:
            return <AdvancedBlocking />;
        case RouteName.user_rules:
            return <UserRules />;
        case RouteName.user_rule:
            return <UserRule />;
        case RouteName.settings:
            return <Settings />;
        case RouteName.safari_extensions:
            return <SafariExtension />;
        case RouteName.filters:
            return <Filters />;
        case RouteName.license:
            return <License />;
        case RouteName.support:
            return <Support />;
        case RouteName.contact_support:
            return <SupportContact />;
        case RouteName.about:
            return <About />;
        case RouteName.quit_reaction:
            return <QuitReaction />;
    }
}

export const Router = observer(RouterComponent);
