// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { Fragment } from 'preact/jsx-runtime';

import { useTrayStore } from 'TrayLib/hooks';
import { RouteName } from 'TrayStore/modules';

import { CheckUpdates } from '../CheckUpdates';
import { FiltersUpdate } from '../FiltersUpdate';
import { Home } from '../Home';

/**
 * Component for handaling Routes. Depending on RouterStore display current page
 */
function RouterComponent() {
    const { router, settings: { settings } } = useTrayStore();
    const getPage = () => {
        switch (router.currentPath) {
            case RouteName.home:
                return <Home />;
            case RouteName.updates:
                return <CheckUpdates />;
            case RouteName.filters:
                return <FiltersUpdate />;
        }
    };

    const page = getPage();

    return <Fragment key={settings?.language}>{page}</Fragment>;
}

export const Router = observer(RouterComponent);
