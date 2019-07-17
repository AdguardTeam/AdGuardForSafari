const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const request = require('request-promise');
const { LOCALES_DIR, TRANSLATION_SERVICE_URL } = require('./consts');
const FormData = require('form-data');
const axios = require('axios');

/**
 * Prepare post params
 */
const prepare = () => {
    const url = TRANSLATION_SERVICE_URL + 'upload';

    const formData = new FormData();
    formData.append('format', 'json');
    formData.append('language', 'en');
    formData.append('filename', 'en.json');
    formData.append('project', 'safari');
    formData.append('file', fs.createReadStream(path.resolve(LOCALES_DIR, 'en.json')));
    const headers = {
        ...formData.getHeaders(),
    };

    return { formData, url, headers };
};

const uploadLocal = async () => {
    const { url, formData, headers } = prepare();

    try {
        const response = await axios.post(url, formData, { headers });
        console.log(`Upload successful! Server responded with: ${JSON.stringify(response.data)}`);
    } catch (e) {
        console.error(JSON.stringify(e.response.data));
    }
};

gulp.task('upload-locales', uploadLocal);
