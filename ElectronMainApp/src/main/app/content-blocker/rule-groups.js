const config = require('config');
const categories = require('../filters/filters-categories');
const log = require('../utils/log');

/**
 * Rules groups for multi content blockers
 *
 * @type {{updateContentBlocker}}
 */
module.exports = (function () {

    const AFFINITY_DIRECTIVE = "!#safari_cb_affinity";
    const AFFINITY_DIRECTIVE_START = "!#safari_cb_affinity(";

    const AntiBannerFilterGroupsId = config.get('AntiBannerFilterGroupsId');
    const AntiBannerFiltersId = config.get('AntiBannerFiltersId');

    /**
     * Rules groups
     *
     * @type {{*}}
     */
    const groups = {
        general: {
            key: "general",
            filterGroups: [AntiBannerFilterGroupsId.AD_BLOCKING_ID, AntiBannerFilterGroupsId.LANGUAGE_SPECIFIC_ID]
        },
        privacy: {
            key: "privacy",
            filterGroups: [AntiBannerFilterGroupsId.PRIVACY_ID]
        },
        security: {
            key: "security",
            filterGroups: [AntiBannerFilterGroupsId.SECURITY_ID]
        },
        socialWidgetsAndAnnoyances: {
            key: "socialWidgetsAndAnnoyances",
            filterGroups: [AntiBannerFilterGroupsId.SOCIAL_ID, AntiBannerFilterGroupsId.ANNOYANCES_ID]
        },
        other: {
            key: "other",
            filterGroups: [AntiBannerFilterGroupsId.OTHER_ID]
        },
        custom: {
            key: "custom",
            filterGroups: [AntiBannerFilterGroupsId.CUSTOM_FILTERS_GROUP_ID]
        }
    };

    /**
     * Affinity blocks
     *
     * @type {{*}}
     */
    const groupsByAffinity = {
        general: [groups.general],
        privacy: [groups.privacy],
        security: [groups.security],
        social: [groups.socialWidgetsAndAnnoyances],
        other: [groups.other],
        custom: [groups.custom],
        all: [groups.general, groups.privacy, groups.security, groups.socialWidgetsAndAnnoyances, groups.other, groups.custom]
    };

    /**
     * Groups provided rules
     *
     * @param rules
     * @return {[*]}
     */
    const groupRules = (rules) => {

        const rulesByFilterId = {};
        rules.forEach(x => {
            if (!rulesByFilterId[x.filterId]) {
               rulesByFilterId[x.filterId] = [];
            }

            rulesByFilterId[x.filterId].push(x);
        });

        const rulesByGroup = {};
        const rulesByAffinityBlocks = {};

        for (let key in groups) {
            const group = groups[key];
            const groupRules = [];

            for (let filterGroupId of group.filterGroups) {
                const filters = categories.getFiltersByGroupId(filterGroupId);
                for (let f of filters) {
                    const filterRules = rulesByFilterId[f.filterId];
                    sortWithAffinityBlocks(filterRules, groupRules, rulesByAffinityBlocks);
                }
            }

            const userFilterRules = rulesByFilterId[AntiBannerFiltersId.USER_FILTER_ID];
            sortWithAffinityBlocks(userFilterRules, groupRules, rulesByAffinityBlocks);

            rulesByGroup[key] = groupRules;
        }

        const result = [];
        for (let groupName in groups) {
            const key = groups[groupName].key;

            if (rulesByAffinityBlocks[key]) {
                rulesByGroup[key] = rulesByGroup[key].concat(rulesByAffinityBlocks[key]);
            }

            result.push({
                key: key,
                rules: rulesByGroup[key]
            });

            log.info(`Affinity block ${key}: rules length: ${rulesByGroup[key].length}`);
        }

        return result;
    };

    /**
     * Selects affinity blocks from rules
     *
     * @param filterRules
     * @param groupRules
     * @param rulesByAffinityBlocks
     */
    const sortWithAffinityBlocks = (filterRules, groupRules, rulesByAffinityBlocks) => {

        if (!filterRules) {
            return;
        }

        let currentBlockGroups = [];

        for (let rule of filterRules) {
            let ruleText = rule.ruleText;

            if (ruleText.startsWith(AFFINITY_DIRECTIVE_START)) {
                currentBlockGroups = parseGroupsByAffinity(ruleText);
            } else if (ruleText.startsWith(AFFINITY_DIRECTIVE)) {
                currentBlockGroups = [];
            } else if (currentBlockGroups.length > 0) {
                for (let group of currentBlockGroups) {
                    if (!rulesByAffinityBlocks[group.key]) {
                        rulesByAffinityBlocks[group.key] = [];
                    }

                    log.debug(`Rule ${ruleText} sorted to ${group.key}`);
                    rulesByAffinityBlocks[group.key].push(rule);
                }
            } else {
                groupRules.push(rule);
            }
        }
    };

    /**
     * Parses groups from affinity directive
     *
     * @param ruleText
     * @return {Array}
     */
    const parseGroupsByAffinity = (ruleText) => {

        let result = [];

        const startIndex = AFFINITY_DIRECTIVE.length + 1;
        const stripped = ruleText.substring(startIndex, ruleText.length - 1);
        const list = stripped.split(",");
        for (let affinityBlock of list) {
            const block = affinityBlock.trim();
            const affinityGroups = groupsByAffinity[block];
            if (affinityGroups && affinityGroups.length > 0) {
                result = result.concat(affinityGroups);
            }
        }

        return result;
    };

    return {
        groupRules,
        groups
    };

})();
