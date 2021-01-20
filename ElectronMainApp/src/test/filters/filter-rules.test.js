const filterRules = require('../../main/app/filters/filter-rules');

describe('Filter rules tests', () => {
    it('Trusted rules', () => {
        const rule1 = filterRules.isTrustedRule('example.com##.banner-ads');
        expect(rule1).toBeTruthy();
        const rule2 = filterRules.isTrustedRule('test.com#%#//scriptlet(\'abort-on-property-read\', \'Object.prototype.getBanner\')');
        expect(rule2).toBeFalsy();
    });
});
