const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const request = require('request-promise');
const { LOCALES_DIR, TRANSLATION_SERVICE_URL } = require('./consts');

/**
 * Prepare post params
 */
const prepare = () => {
    const url = TRANSLATION_SERVICE_URL + 'upload';
    const formData = {
        format: 'json',
        language: 'en',
        filename: 'en.json',
        project: 'safari',
        file: fs.createReadStream(path.resolve(LOCALES_DIR, 'en.json'))
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
