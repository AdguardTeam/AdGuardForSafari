const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const { sharedResourcesPath, getBuildNumber } = require('safari-ext');
const { getConverterVersion } = require('safari-converter-lib');

const {
    app, dialog, BrowserWindow,
} = require('electron');

const applicationApi = require('../../api');
const log = require('./log');
const agApp = require('../app');

/**
 * On export logs clicked
 */
const exportLogs = () => {
    log.info('Exporting log file..');

    const options = {
        defaultPath: `${app.getPath('documents')}/adg_safari_logs_${Date.now()}.zip`,
    };

    dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options).then(({ cancelled, filePath }) => {
        if (cancelled) {
            return;
        }

        if (!filePath) {
            return;
        }

        const logsPath = log.findLogPath();
        if (!logsPath) {
            return;
        }

        log.info(`Log file path: ${logsPath}`);

        const state = [];
        state.push(`Application version: ${agApp.getVersion()} (${getBuildNumber()})`);
        state.push(`Application channel: ${agApp.getChannel()}`);
        state.push(`Application locale: ${agApp.getLocale()}`);
        state.push(`Converter version: ${getConverterVersion()}`);
        state.push(`Enabled filters: [ ${applicationApi.getEnabledFilterIds().join(',')} ]`);

        const statePath = path.join(path.dirname(logsPath), 'state.txt');
        fs.writeFileSync(statePath, state.join('\r\n'));

        const zip = new AdmZip();
        zip.addLocalFile(logsPath);
        zip.addLocalFile(statePath);

        const resourcesPath = sharedResourcesPath();
        if (fs.existsSync(resourcesPath) && fs.lstatSync(resourcesPath).isDirectory()) {
            const files = fs.readdirSync(resourcesPath);
            files.forEach((file) => {
                if (file.endsWith('.json')) {
                    zip.addLocalFile(`${resourcesPath}/${file}`);
                }
            });
        } else {
            log.error(`Unable to export JSON files. There is no such directory: ${resourcesPath}`);
        }
        try {
            zip.writeZip(filePath);
        } catch (error) {
            log.error(`Unable to create archive file: ${error.message}`);
        }
    });
};

module.exports = {
    exportLogs,
};
