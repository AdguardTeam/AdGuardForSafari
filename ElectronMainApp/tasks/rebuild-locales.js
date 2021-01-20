const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const findInFiles = require('find-in-files');
const { LOCALES_DIR } = require('./consts');

/**
 * Search configuration
 */
const configuration = {
    src: path.join('../', LOCALES_DIR, 'en.json'), // Base language json
    target: [ './src/' ], // Directory to search occurrences
    output: LOCALES_DIR + '/en.json', // Place to put result
    filesReg: '(.ts|.js|.html)$'
};

/**
 * Find used locale items in directory files
 * 
 * @param {object} messages locale object format 
 * @param {string} directory 
 */
function findAllОccurrencesInDirectory(messages, directory, filesReg) {
    const endResult = {};
    const matchesPromises = Object
        .keys(messages)
        .map(key => findInFiles.findSync(key, directory, filesReg));

    return new Promise((resolve, reject) => {
        Promise
            .all(matchesPromises)
            .then(matchesArray => {
                matchesArray
                    .map(results => Object.values(results)[0])
                    .filter(results => !!results)
                    .forEach(res => endResult[res.matches[0]] = messages[res.matches[0]]);

                resolve(endResult);
            })
            .catch(err => reject());
    });
}

/**
 * Promise wrapper for writing in file
 * 
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
 * Initialization of search process
 */
const rebuildLocales = done => {
    const { 
        src, 
        target,
        output = 'result.json',
        filesReg = '.html$'
    } = configuration;
    let result = {};

    if (!src) {
        throw new Error('No source path');
    }

    if (!target || !target.length) {
        throw new Error('No target directories');
    }

    if (typeof target === 'string') {
        target = [target];
    }

    const source = require(src);
    const occurrencesDefer = target.map(directory => findAllОccurrencesInDirectory(source, directory, filesReg));

    Promise
        .all(occurrencesDefer)
        .then(occurrences => {
            occurrences.forEach(item => result = { ...result, ...item });
            return writeInFile(output, result);
        })
        .then(() => {
            console.log('Success');
            done();
        })
        .catch(err => {
            console.log(err);
            done(err);
        });

}

gulp.task('rebuild-locales', rebuildLocales);