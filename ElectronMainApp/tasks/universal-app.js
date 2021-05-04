const { makeUniversalApp } = require('@electron/universal');
const path = require('path');
const fs = require('fs');

const { log } = console;

const targetDir = process.argv.slice(2)[0];
if (!targetDir) {
    throw new Error('No target directory provided');
}

if (!process.argv.slice(2)[1]) {
    throw new Error('No target platform provided');
}
const platform = process.argv.slice(2)[1] === 'true' ? 'darwin' : 'mas';

const APP_NAME = 'AdGuard for Safari.app';

const X64_APP_PATH = path.resolve(targetDir, 'x86_64', `AdGuard for Safari-${platform}-x64`, APP_NAME);
const ARM64_APP_PATH = path.resolve(targetDir, 'arm64', `AdGuard for Safari-${platform}-arm64`, APP_NAME);
const OUTPUT_APP_PATH = path.resolve(targetDir, APP_NAME);

(async () => {
    if (!fs.existsSync(X64_APP_PATH) || !fs.existsSync(ARM64_APP_PATH)) {
        log('Nothing to build');
        return;
    }
    await makeUniversalApp({
        x64AppPath: X64_APP_PATH,
        arm64AppPath: ARM64_APP_PATH,
        outAppPath: OUTPUT_APP_PATH,
    });
})();
