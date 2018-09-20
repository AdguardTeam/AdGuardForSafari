// const fs = require('fs');
// const path = require('path');
// const gulp = require('gulp');
// const md5 = require('gulp-hash-creator');
// const request = require('request');
// const { LOCALES, LOCALES_DIR, PRIVATE_FILES } = require('./consts');

// /**
//  * We use this pairs because we have different locale codes in the onesky and the extension
//  */
// const LOCALE_PAIRS = {
//     /**
//      * Norvegian language locale code in oneskyapp is 'no'
//      * chrome recognizes both locale code 'nb' and 'no',
//      * but firefox recognizes only 'nb'
//      */
//     nb: 'no',
//     /**
//      * Belarusian language locale code in oneskyapp is 'be-BY'
//      * chrome doesn't recognize belarusian language at all
//      * firefox regognizes 'be' code
//      */
//     be: 'be-BY',
// };

// /**
//  * Hash content
//  * 
//  * @param {string} content 
//  */
// const hashString = content => md5({ content });

// const prepare = () => {
//     let options = {
//         locales: LOCALES,
//         sourceFile: 'messages.json',
//     };
//     let oneskyapp;
//     try {
//         oneskyapp = JSON.parse(fs.readFileSync(path.resolve(PRIVATE_FILES, 'oneskyapp.json')));
//     } catch (err) {
//         throw new Error(err);
//     }

//     options = { ...options, ...oneskyapp };

//     let urls = [];

//     options.locales.forEach((localization) => {

//         const timestamp = Math.round(new Date().getTime() / 1000);
//         const url = oneskyapp.url + oneskyapp.projectId + '/translations';
//         const oneSkyLocalization = LOCALE_PAIRS[localization] || localization;

//         const formData = {
//             timestamp,
//             locale: 'en',
//             source_file_name: options.sourceFile,
//             export_file_name: oneSkyLocalization + '.json',
//             api_key: oneskyapp.apiKey,            
//             dev_hash: hashString(timestamp + oneskyapp.secretKey)  
//         };
//     });

//     return { url, formData };
// };

// const requestPromise = (url, formData) => {
//     return new Promise()
// }

// const download = () => {
// }
