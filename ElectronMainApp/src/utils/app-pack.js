module.exports = (() => {
    const _resourcePath = function (resPath) {
        const path = require('path');
        // const pr = require('electron').remote ? require('electron').remote.process : process;
        // const base = path.dirname(pr.mainModule.filename);
        const base = '/Applications/AdGuard for Safari.app/Contents/Resources/app-x64.asar/';
        return path.join(base, resPath);
    };

    return {
        resourcePath: _resourcePath,
    };
})();
