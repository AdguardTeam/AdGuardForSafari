const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const md5 = require('gulp-hash-creator');
const requestPromise = require('request-promise');
const { LOCALES_DIR, PRIVATE_FILES } = require('./consts');
const { LOCALES } = require('../locales/locales');

/**
 * We use this pairs because we have different locale codes in the onesky and the extension
 */
const LOCALE_PAIRS = {
    /**
     * Norvegian language locale code in oneskyapp is 'no'
     * chrome recognizes both locale code 'nb' and 'no',
     * but firefox recognizes only 'nb'
     */
    nb: 'no',
    /**
     * Belarusian language locale code in oneskyapp is 'be-BY'
     * chrome doesn't recognize belarusian language at all
     * firefox regognizes 'be' code
     */
    be: 'be-BY',
};

/**
 * Hash content
 * @param {string} content 
 */
const hashString = content => md5({ content });

/**
 * Prepare params to get translations from oneskyapp
 * @param {string} locale language shortcut
 * @param {object} oneskyapp config oneskyapp
 */
const prepare = (locale, oneskyapp) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const oneSkyLocalization = LOCALE_PAIRS[locale] || locale;

    let url = [];
    url.push(oneskyapp.url + oneskyapp.projectId);
    url.push('/translations?locale=' + oneSkyLocalization);
    url.push('&source_file_name=' + 'en.json');
    url.push('&export_file_name=' + oneSkyLocalization + '.json');
    url.push('&api_key=' + oneskyapp.apiKey);
    url.push('&timestamp=' + timestamp);
    url.push('&dev_hash=' + hashString(timestamp + oneskyapp.secretKey));
    url = url.join('');

    return url;
};

/**
 * Promise wrapper for writing in file
 * @param {string} filename 
 * @param {any} body 
 */
function writeInFile(filename, body) {
    return new Promise((resolve, reject) => {
        if (typeof body !== 'string') {
            try {
                body = JSON.stringify(body, null, 4);
            } catch (err) {
                reject(err);
            }
        }

        fs.writeFile(filename, body, (err) => {
            if (err) reject(err);
            resolve('Ok');
        });
    })
}

/**
 * Request to server onesky
 * @param {string} url 
 * @param {string} locale 
 */
const request = (url, locale) => {
    return requestPromise.get(url)
        .then(res => {
            if (res.length) {
                const pathToFile = path.join(LOCALES_DIR, locale + '.json');
                return writeInFile(pathToFile, res);
            }
            return null;
        })
        .then(res => locale += res ? ' - OK' : ' - Empty')
        .catch(err => {
            console.log(err);
            return locale + ' - Not OK';
        });
}

/**
 * Download locales
 * @param {function} done
 */
const download = done => {
    const locales = LOCALES;
    let oneskyapp;
    try {
        oneskyapp = JSON.parse(fs.readFileSync(path.resolve(PRIVATE_FILES, 'oneskyapp.json')));
    } catch (err) {
        throw new Error(err);
    }

    const requests = locales.map(locale => {
        const url = prepare(locale, oneskyapp);
        return request(url, locale);
    });

    Promise
        .all(requests)
        .then(res => {
            res.forEach(item => console.log(item));
            done();
        })
        .catch(err => done(err));
}

gulp.task('download-locales', download);
