jest.mock('electron-store');
const electronStore = require('electron-store');
const mockStore = require('./mock-electron-store');
const store = jest.fn(() => new mockStore());
electronStore.mockImplementation(store);

const storage = require('../../main/app/storage/storage');
const rulesStorage = require('../../main/app/storage/rules-storage');

const rules = [
    'fnp.de#?#.article-content > article > aside[-ext-has=\'.sharing\']',
    'computerworld.hu#?#.field_global_rightside > .box-html:has(h3:contains(Kövessen Facebookon))',
    'filmbuzi.hu#?##right > h2:contains(Twitter)',
    'sinonim.org#?#div.main > div:has(> .ya-share2)',
];

describe('Storage tests', () => {
    it('Basic storage tests', () => {
        storage.setItem('test-key', 'test-value');
        const val = storage.getItem('test-key');
        expect(val).toEqual('test-value');

        expect(storage.hasItem('test-key')).toBeTruthy();

        storage.removeItem('test-key');
        expect(storage.hasItem('test-key')).toBeFalsy();
    });

    it('Rules storage tests', () => {
        rulesStorage.write('test', rules, () => {
            const testRules = rulesStorage.readSync('test');
            expect(testRules).toEqual(rules);
        });

        rulesStorage.remove('test', () => {
            rulesStorage.read('test', (testRules) => {
                expect(testRules).not.toBeDefined();
            })
        })
    });
});
