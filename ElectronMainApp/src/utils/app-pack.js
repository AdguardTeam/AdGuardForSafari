const path = require('path');
const { app, ipcRenderer } = require('electron');

/**
 * This module can be used in both main and renderer process
 * If it is used in the main process then app.getAppPath() is used
 * If it is used in the renderer process then ipcRenderer sends message to main process to get app path
 */
module.exports = (() => {
    const _resourcePath = function (resPath) {
        let base;
        if (app) {
            base = app.getAppPath();
        } else {
            base = ipcRenderer.sendSync('renderer-to-main', JSON.stringify({
                'type': 'getAppPath',
            }));
        }

        return path.join(base, resPath);
    };

    return {
        resourcePath: _resourcePath,
    };
})();
