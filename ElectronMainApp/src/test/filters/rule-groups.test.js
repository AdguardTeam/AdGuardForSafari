const serviceClient = require('../../main/app/filters/service-client');
const cache = require('../../main/app/filters/cache');
const groups = require('../../main/app/content-blocker/rule-groups');

jest.mock('../../utils/app-pack');

const rules = [
    {
        filterId: 1,
        ruleText: 'example1.org##.ad',
    },
    {
        filterId: 1,
        ruleText: '!#safari_cb_affinity(security)',
    },
    {
        filterId: 1,
        ruleText: 'example2.org##.ad',
    },
    {
        filterId: 1,
        ruleText: '!#safari_cb_affinity(other)',
    },
    {
        filterId: 1,
        ruleText: 'example6.org##.ad',
    },
    {
        filterId: 1,
        ruleText: '!#safari_cb_affinity',
    },
    {
        filterId: 1,
        ruleText: '!#safari_cb_affinity',
    },
    {
        filterId: 1,
        ruleText: 'example3.org##.ad',
    },
    {
        filterId: 3,
        ruleText: 'example4.org##.ad',
    },
    {
        filterId: 4,
        ruleText: 'example5.org##.ad',
    },
];

// ! Rules for test: affinity directive is inside another one
// example1.org##.ad
// !#safari_cb_affinity(security)
// example2.org##.ad
// !#safari_cb_affinity(other)
// example6.org##.ad
// !#safari_cb_affinity
// !#safari_cb_affinity
// example3.org##.ad
// example4.org##.ad
// example5.org##.ad

describe('Rule groups test', () => {
    it('Affinity directive test', (done) => {
        serviceClient.loadRemoteFiltersMetadata((metadata) => {
            cache.setData(metadata);

            const groupedRules = groups.groupRules(rules);

            expect(groupedRules[0].key).toBe('general');
            expect(groupedRules[0].rules).toHaveLength(2);
            expect(groupedRules[0].rules[0].ruleText).toBe('example1.org##.ad');
            expect(groupedRules[0].rules[1].ruleText).toBe('example3.org##.ad');

            expect(groupedRules[1].key).toBe('privacy');
            expect(groupedRules[1].rules).toHaveLength(1);
            expect(groupedRules[1].rules[0].ruleText).toBe('example4.org##.ad');

            expect(groupedRules[2].key).toBe('security');
            expect(groupedRules[2].rules).toHaveLength(1);
            expect(groupedRules[2].rules[0].ruleText).toBe('example2.org##.ad');

            expect(groupedRules[3].key).toBe('socialWidgetsAndAnnoyances');
            expect(groupedRules[3].rules).toHaveLength(1);
            expect(groupedRules[3].rules[0].ruleText).toBe('example5.org##.ad');

            expect(groupedRules[4].key).toBe('other');
            expect(groupedRules[4].rules).toHaveLength(1);
            expect(groupedRules[4].rules[0].ruleText).toBe('example6.org##.ad');

            done();
        });
    });
});
