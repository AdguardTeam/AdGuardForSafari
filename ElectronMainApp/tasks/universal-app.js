const { makeUniversalApp } = require('@electron/universal');
const path = require('path');
const fs = require('fs');

const { log } = console;

const BUILD_FOLDER = path.resolve(__dirname, '../../build');

const X64_APP_PATH = `${BUILD_FOLDER}/AdGuard for Safari x64.app`;
const ARM64_APP_PATH = `${BUILD_FOLDER}/AdGuard for Safari arm64.app`;
const OUTPUT_APP_PATH = `${BUILD_FOLDER}/AdGuard for Safari.app`;

(async () => {
    if (!fs.existsSync(X64_APP_PATH) || !fs.existsSync(ARM64_APP_PATH)) {
        log('Nothing to build');
        return;
    }
    await makeUniversalApp({
        x64AppPath: X64_APP_PATH,
        arm64AppPath: ARM64_APP_PATH,
        outAppPath: OUTPUT_APP_PATH,
        force: true,
    });
})();
