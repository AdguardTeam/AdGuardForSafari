/* global i18n */

const { ipcRenderer } = require('electron');

/**
 * Content blockers tab
 *
 * @returns {*}
 * @constructor
 */
const ContentBlockersScreen = function (antiBannerFilters, userFilter, allowlist, userSettings) {
    'use strict';

    /**
     * Elements to extension bundles dictionary
     *
     * @type {{*}}
     */
    const extensionElements = {
        'com.adguard.safari.AdGuard.BlockerExtension': 'cb_general',
        'com.adguard.safari.AdGuard.BlockerPrivacy': 'cb_privacy',
        'com.adguard.safari.AdGuard.BlockerSocial': 'cb_social',
        'com.adguard.safari.AdGuard.BlockerSecurity': 'cb_security',
        'com.adguard.safari.AdGuard.BlockerOther': 'cb_other',
        'com.adguard.safari.AdGuard.BlockerCustom': 'cb_custom',
    };

    /**
     * Extension element for bundle identifier
     *
     * @param bundleId
     * @return {*}
     */
    const getExtensionElement = (bundleId) => {
        const elementId = extensionElements[bundleId];
        if (elementId) {
            return document.getElementById(elementId);
        }

        return null;
    };

    /**
     * Updates content blockers info
     *
     * @param info
     */
    const updateContentBlockers = (info) => {
        for (const extensionId in info.extensions) {
            const state = info.extensions[extensionId];

            const element = getExtensionElement(extensionId);
            if (element) {
                const icon = element.querySelector('.extension-block-ico');
                const warning = element.querySelector('.cb_warning');
                const rulesCount = element.querySelector('.cb_rules_count');

                icon.classList.remove('block-type__ico-info--load');

                icon.classList.add(state ? 'block-type__ico-info--check' : 'block-type__ico-info--warning');
                warning.style.display = state ? 'none' : 'flex';
                warning.textContent = i18n.__('options_cb_disabled_warning.message');

                rulesCount.style.display = state ? 'flex' : 'none';
            }
        }
    };

    /**
     * Updates extension rules count
     *
     * @param bundleId
     * @param info
     * @param filtersInfo
     */
    const updateExtensionState = (bundleId, info, filtersInfo) => {
        const element = getExtensionElement(bundleId);
        if (element) {
            if (info) {
                const rulesInfoElement = element.querySelector('.cb_rules_count');
                const icon = element.querySelector('.extension-block-ico');

                if (info.overlimit) {
                    icon.classList.add('block-type__ico-info--overlimit-warning');

                    let textContent = i18n.__('options_cb_rules_overlimit_info.message', info.rulesCount);
                    textContent = textContent.replace('$2', info.rulesCount - 50000);

                    // rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.add('cb_overlimit_warning');
                    rulesInfoElement.innerHTML = textContent;
                } else if (info.hasError) {
                    icon.classList.add('block-type__ico-info--overlimit-warning');

                    // rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.add('cb_overlimit_warning');
                    rulesInfoElement.textContent = i18n.__('options_cb_compilation_warning.message');
                } else {
                    icon.classList.remove('block-type__ico-info--overlimit-warning');

                    // rulesInfoElement.style.display = 'flex';
                    rulesInfoElement.classList.remove('cb_overlimit_warning');
                    rulesInfoElement.textContent = i18n.__n('options_cb_rules_info.message', info.rulesCount);
                }
            }

            if (filtersInfo) {
                const filtersInfoElement = element.querySelector('.cb_filters_info');
                filtersInfoElement.textContent = filtersInfo;
            }
        }
    };

    /**
     * Sets loading state for extensions
     */
    const setLoading = () => {
        const extensionsIcons = document.querySelectorAll('.extension-block-ico');
        extensionsIcons.forEach((ext) => {
            ext.classList.remove('block-type__ico-info--warning');
            ext.classList.remove('block-type__ico-info--check');

            ext.classList.add('block-type__ico-info--load');
        });
    };

    /**
     * Initialize
     *
     */
    const init = () => {
        ipcRenderer.on('getContentBlockersMetadataResponse', (e, response) => {
            const userFilterEnabled = userSettings.values[userSettings.names.USERRULES_ENABLED]
                && !userFilter.isUserFilterEmpty();
            const allowlistEnabled = userSettings.values[userSettings.names.ALLOWLIST_ENABLED]
                && !allowlist.isAllowlistEmpty();
            for (const extension of response) {
                const filtersInfo = antiBannerFilters.getFiltersInfo(
                    extension.groupIds,
                    userFilterEnabled,
                    allowlistEnabled
                );
                updateExtensionState(extension.bundleId, extension.rulesInfo, filtersInfo);
            }
        });
    };

    return {
        updateContentBlockers,
        setLoading,
        updateExtensionState,
        init,
    };
};

module.exports = ContentBlockersScreen;
