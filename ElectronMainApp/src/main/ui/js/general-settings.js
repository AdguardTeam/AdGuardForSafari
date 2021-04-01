/* global i18n */

const { ipcRenderer } = require('electron');
const utils = require('./utils/common-utils');
const checkboxUtils = require('./utils/checkbox-utils');

/**
 * Settings block
 *
 * @returns {{render: render}}
 * @constructor
 */
const Settings = function (
    userSettings,
    enabledFilters,
    AntiBannerFiltersId,
    AntiBannerFilterGroupsId,
    isProtectionRunning
) {
    'use strict';

    const Checkbox = function (id, property, options) {
        options = options || {};
        const { negate } = options;
        const { hidden } = options;

        const element = document.querySelector(id);
        if (!hidden) {
            let listener = options.eventListener;
            if (!listener) {
                listener = function () {
                    ipcRenderer.send('renderer-to-main', JSON.stringify({
                        'type': 'changeUserSetting',
                        'key': property,
                        'value': negate ? !this.checked : this.checked,
                    }));
                };
            }

            element.addEventListener('change', listener);
        }

        const render = function () {
            if (hidden) {
                element.closest('li').style.display = 'none';
                return;
            }
            let checked = userSettings.values[property];
            if (negate) {
                checked = !checked;
            }

            checkboxUtils.updateCheckbox([element], checked);
        };

        return {
            render,
        };
    };
    const checkboxes = [];
    checkboxes.push(new Checkbox(
        '#showAppUpdatedNotification',
        userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION,
        { negate: true }
    ));

    const toggleAcceptableAdsFilter = utils.debounce((enabled) => {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': enabled ? 'addAndEnableFilter' : 'disableFilter',
            filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
        }));
    }, 500);

    const allowAcceptableAdsCheckbox = document.querySelector('#allowAcceptableAds');
    allowAcceptableAdsCheckbox.addEventListener('change', (e) => {
        toggleAcceptableAdsFilter(e.target.checked);
    });

    checkboxes.push(new Checkbox('#showTrayIcon', userSettings.names.SHOW_TRAY_ICON));
    checkboxes.push(new Checkbox('#launchAtLogin', userSettings.names.LAUNCH_AT_LOGIN, {
        eventListener() {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'changeLaunchAtLogin',
                'value': this.checked,
            }));
        },
    }));
    checkboxes.push(new Checkbox('#verboseLogging', userSettings.names.VERBOSE_LOGGING));
    checkboxes.push(new Checkbox('#enableHardwareAcceleration', userSettings.names.DISABLE_HARDWARE_ACCELERATION, {
        negate: true,
    }));

    const initUpdateFiltersPeriodSelect = () => {
        const periods = [48, 24, 12, 6, 1]; // in hours
        const periodSelectOptions = periods.map((item) => ({
            value: item,
            name: i18n.__n('options_filters_update_period_number.message', item),
        }));
        periodSelectOptions.push({
            value: -1,
            name: i18n.__('options_filters_period_not_update.message'),
        });

        const currentPeriodValue = userSettings.values[userSettings.names.UPDATE_FILTERS_PERIOD];
        const periodSelect = document.getElementById('filterUpdatePeriod');
        /* eslint-disable-next-line no-unused-expressions */
        periodSelect && periodSelect.addEventListener('change', (event) => {
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                type: 'changeUpdateFiltersPeriod',
                value: parseInt(event.target.value, 10),
            }));
        });

        return new Select('filterUpdatePeriod', periodSelectOptions, currentPeriodValue);
    };
    const periodSelect = initUpdateFiltersPeriodSelect();

    const updateAcceptableAdsCheckbox = utils.debounce((filter) => {
        if (filter.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
            checkboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], filter.enabled);
        }
    }, 500);

    /**
     * Updates `Allow search ads and the self-promotion` checkbox on `Other` group state change
     */
    const updateAcceptableAdsCheckboxByGroupState = utils.debounce((group) => {
        if (group.groupId === AntiBannerFilterGroupsId.SEARCH_AND_SELF_PROMO_FILTER_GROUP_ID) {
            const selfAdsFilter = group.filters.find((f) => (
                f.filterId === AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            ));
            const state = group.enabled && selfAdsFilter?.enabled;
            checkboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], state);
        }
    }, 500);

    const checkboxSelectors = {
        'show-app-updated-disabled': '#showAppUpdatedNotification',
        'hardware-acceleration-disabled': '#enableHardwareAcceleration',
        'launch-at-login': '#launchAtLogin',
        'show-tray-icon': '#showTrayIcon',
        'verbose-logging': '#verboseLogging',
        'default-whitelist-mode': '#changeDefaultAllowlistMode',
        'userrules-enabled': '#userrulesInput',
        'allowlist-enabled': '#allowlistInput',
    };

    /**
     * Updates checkbox value by selector name
     * @param {string} propertyName
     * @param {boolean} value
     * @param {boolean} inverted
     */
    const updateCheckboxValue = (propertyName, value, inverted) => {
        const checkbox = document.querySelector(checkboxSelectors[propertyName]);
        checkboxUtils.updateCheckbox([checkbox], inverted ? !value : value);
    };

    const filterUpdatePeriodSelect = document.querySelector('#filterUpdatePeriod');
    const updateFilterUpdatePeriodSelect = (period) => {
        filterUpdatePeriodSelect.value = period;
    };

    const enableProtectionNotification = document.querySelector('#enableProtectionNotification');
    const showProtectionStatusWarning = function (protectionEnabled) {
        if (protectionEnabled) {
            enableProtectionNotification.style.display = 'none';
        } else {
            enableProtectionNotification.style.display = 'flex';
        }
    };

    const notificationEnableProtectionLink = document.getElementById('notificationEnableProtectionLink');
    /* eslint-disable-next-line no-unused-expressions */
    notificationEnableProtectionLink && notificationEnableProtectionLink.addEventListener('click', (e) => {
        e.preventDefault();

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            type: 'enableProtection',
        }));
    });

    const showUpdateIntervalNotification = function () {
        const updateIntervalNotification = document.querySelector('#updateIntervalNotification');
        const hideUpdateIntervalNotificationKey = 'hide-update-interval-notification';
        const hideUpdateIntervalNotification = !!window.sessionStorage.getItem(hideUpdateIntervalNotificationKey);
        if (filterUpdatePeriodSelect.value === '-1' && !hideUpdateIntervalNotification) {
            updateIntervalNotification.style.display = 'flex';
        } else {
            updateIntervalNotification.style.display = 'none';
        }
    };

    const updateAllowlistState = () => {
        ipcRenderer.once('isAllowlistEnabledResponse', (e, isAllowlistEnabled) => {
            updateCheckboxValue('allowlist-enabled', isAllowlistEnabled, false);
        });
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isAllowlistEnabled',
        }));
    };

    const updateUserFilterState = () => {
        ipcRenderer.once('isUserrulesEnabledResponse', (e, isUserrulesEnabled) => {
            updateCheckboxValue('userrules-enabled', isUserrulesEnabled, false);
        });
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isUserrulesEnabled',
        }));
    };

    const render = function () {
        periodSelect.render();

        for (let i = 0; i < checkboxes.length; i += 1) {
            checkboxes[i].render();
        }

        ipcRenderer.once('isGroupEnabledResponse', (e, isGroupOtherEnabled) => {
            const isSelfAdsEnabled = isGroupOtherEnabled
                && AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;
            updateAcceptableAdsCheckbox({
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
                enabled: isSelfAdsEnabled,
            });
        });

        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'isGroupEnabled',
            'groupId': AntiBannerFilterGroupsId.SEARCH_AND_SELF_PROMO_FILTER_GROUP_ID,
        }));

        showProtectionStatusWarning(isProtectionRunning);
        showUpdateIntervalNotification();
        updateUserFilterState();
        updateAllowlistState();
    };

    const updateContentBlockersDescription = (info) => {
        const cbDescription = document.getElementById('options_content_blockers_desc_container');
        if (info.enabledContentBlockersCount === 0) {
            cbDescription.textContent = i18n.__('options_content_blockers_disabled_desc.message');
        } else {
            cbDescription.textContent = i18n.__n(
                'options_content_blockers_desc.message',
                info.enabledContentBlockersCount
            );
        }
    };

    return {
        render,
        updateAcceptableAdsCheckbox,
        updateAcceptableAdsCheckboxByGroupState,
        updateCheckboxValue,
        updateFilterUpdatePeriodSelect,
        showProtectionStatusWarning,
        showUpdateIntervalNotification,
        updateContentBlockersDescription,
        updateAllowlistState,
        updateUserFilterState,
    };
};

/**
 * Generate HTML Element SELECT with passed options
 *
 * @param {string} id select ID
 * @param {Array<Object | number | string>} options Array of options
 * @param {string | number} value current select value (set 'select' attribute to option)
 */
const Select = function (id, options, value) {
    if (!id) {
        /* eslint-disable-next-line no-console */
        console.error(`SELECT with id=${id} not found`);
        return;
    }

    let select = document.getElementById(id);
    if (!select) {
        select = document.createElement('select');
    }
    select.setAttribute('id', id);
    select.value = value;

    if (Array.isArray(options)) {
        options
            .map((item) => (typeof item === 'object'
            && item.value !== undefined
            && item.name !== undefined
                ? new Option(item.value, item.name, item.value === value)
                : new Option(item, item, item === value)))
            .forEach((option) => select.appendChild(option.render()));
    }

    const render = () => select;

    return { render };
};

/**
 * Generate HTML Element OPTION with passed params
 *
 * @param {string | number} value Select value
 * @param {string | number} name Select name text
 */
const Option = function (value, name, selected) {
    const option = document.createElement('option');
    option.setAttribute('value', value);
    if (selected) {
        option.setAttribute('selected', selected);
    }
    option.innerText = name;

    const render = () => option;

    return { render };
};

module.exports = Settings;
