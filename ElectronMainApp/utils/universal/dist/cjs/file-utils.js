"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAppFiles = exports.AppFileType = void 0;
const cross_spawn_promise_1 = require("@malept/cross-spawn-promise");
const fs = require("fs-extra");
const path = require("path");
const MACHO_PREFIX = 'Mach-O ';
var AppFileType;
(function (AppFileType) {
    AppFileType[AppFileType["MACHO"] = 0] = "MACHO";
    AppFileType[AppFileType["PLAIN"] = 1] = "PLAIN";
    AppFileType[AppFileType["SNAPSHOT"] = 2] = "SNAPSHOT";
    AppFileType[AppFileType["APP_CODE"] = 3] = "APP_CODE";
})(AppFileType = exports.AppFileType || (exports.AppFileType = {}));
/**
 *
 * @param appPath Path to the application
 */
exports.getAllAppFiles = async (appPath) => {
    const files = [];
    const visited = new Set();
    const traverse = async (p) => {
        p = await fs.realpath(p);
        if (visited.has(p))
            return;
        visited.add(p);
        const info = await fs.stat(p);
        if (info.isSymbolicLink())
            return;
        if (info.isFile()) {
            let fileType = AppFileType.PLAIN;
            const fileOutput = await cross_spawn_promise_1.spawn('file', ['--brief', '--no-pad', p]);
            if (p.includes('app.asar')) {
                fileType = AppFileType.APP_CODE;
            }
            else if (fileOutput.startsWith(MACHO_PREFIX)) {
                fileType = AppFileType.MACHO;
            }
            else if (p.endsWith('.bin')) {
                fileType = AppFileType.SNAPSHOT;
            }
            files.push({
                relativePath: path.relative(appPath, p),
                type: fileType,
            });
        }
        if (info.isDirectory()) {
            for (const child of await fs.readdir(p)) {
                await traverse(path.resolve(p, child));
            }
        }
    };
    await traverse(appPath);
    return files;
};
//# sourceMappingURL=file-utils.js.map