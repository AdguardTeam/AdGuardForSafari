const { dialog, ipcMain } = require('electron');
const fs = require('fs');

const log = require('./app/utils/log.js');
const { InvokeType } = require('../common/invoke-type');

/**
 * Module handles invokes sent from renderer process
 */
class Invokes {
    static init() {
        ipcMain.handle(InvokeType.ExportFile, Invokes.onExportFile);
    }

    /**
     * onExportFile handles export file invoke
     * @param event
     * @param path
     * @param data
     * @returns {Promise<void>}
     */
    static async onExportFile(event, { path, data }) {
        const dialogResponse = await dialog.showSaveDialog({ defaultPath: path });
        if (dialogResponse.canceled) {
            return;
        }

        try {
            await fs.promises.writeFile(dialogResponse.filePath.toString(), data);
        } catch (e) {
            log.info('Wasn\'t able to export file due to error: {0}', e.message);
        }
    }
}

module.exports = {
    Invokes,
};
