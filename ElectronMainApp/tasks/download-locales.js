const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const requestPromise = require('request-promise');
const { LOCALES_DIR, TRANSLATION_SERVICE_URL } = require('./consts');
const { LOCALES } = require('../locales/locales');

/**
 * Prepare params to get translations from oneskyapp
 * @param {string} locale language shortcut
 */
const prepare = (locale) => {
    let url = [];
    url.push(TRANSLATION_SERVICE_URL);
    url.push('download?format=json');
    url.push('&project=safari');
    url.push('&language=' + locale);
    url.push('&filename=en.json');
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
};

/**
 * Download locales
 * @param {function} done
 */
const download = done => {
    const requests = LOCALES.map(locale => {
        const url = prepare(locale);
        return request(url, locale);
    });

    Promise
        .all(requests)
        .then(res => {
            res.forEach(item => console.log(item));
            done();
        })
        .catch(err => done(err));
};

gulp.task('download-locales', download);
