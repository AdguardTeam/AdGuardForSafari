const gulp = require('gulp');
const path = require('path');
const md5 = require('gulp-hash-creator');
const fs = require('fs');
const request = require('request-promise');
const { LOCALES_DIR, PRIVATE_FILES } = require('./consts');

/**
 * Hash content
 * 
 * @param {string} content 
 */
const hashString = content => md5({ content });

/**
 * Prepare post params
 */
const prepare = () => {
    let oneskyapp;
    try {
        oneskyapp = JSON.parse(fs.readFileSync(path.resolve(PRIVATE_FILES, 'oneskyapp.json')));
    } catch (err) {
        throw new Error(err);
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const url = oneskyapp.url + oneskyapp.projectId + '/files';
    const formData = {
        timestamp,
        file: fs.createReadStream(path.resolve(LOCALES_DIR, 'en.json')),
        file_format: 'HIERARCHICAL_JSON',
        locale: 'en',
        is_keeping_all_strings: 'false',
        api_key: oneskyapp.apiKey,
        dev_hash: hashString(timestamp + oneskyapp.secretKey)  
    };

    return { url, formData };
};

/**
 * Make request to onesky to upload new json
 * 
 * @param {function} done callback to run when the process end
 */
const upload = done => {
    const { url, formData } = prepare();
    request
        .post({ url, formData })
        .then(() => done())
        .catch(err => done(err));
};

gulp.task('upload-locales', upload);
