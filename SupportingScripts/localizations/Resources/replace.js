/**
 * Replace helper script, in case bash sed doesn't work well
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

const substr = args[0];
const toReplace = args[1];
const file = args[2];

const filePath = path.join("", file);
let text = fs.readFileSync(filePath, {encoding: 'utf16le'});

const modified = text.replace(substr, toReplace);
fs.writeFileSync(filePath, modified, {encoding: 'utf16le'});