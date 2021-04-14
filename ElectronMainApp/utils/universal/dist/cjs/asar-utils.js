"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAsarMode = exports.AsarMode = void 0;
const fs = require("fs-extra");
const path = require("path");
const debug_1 = require("./debug");
var AsarMode;
(function (AsarMode) {
    AsarMode[AsarMode["NO_ASAR"] = 0] = "NO_ASAR";
    AsarMode[AsarMode["HAS_ASAR"] = 1] = "HAS_ASAR";
})(AsarMode = exports.AsarMode || (exports.AsarMode = {}));
exports.detectAsarMode = async (appPath) => {
    debug_1.d('checking asar mode of', appPath);
    const asarPath = path.resolve(appPath, 'Contents', 'Resources', 'app.asar');
    if (!(await fs.pathExists(asarPath))) {
        debug_1.d('determined no asar');
        return AsarMode.NO_ASAR;
    }
    debug_1.d('determined has asar');
    return AsarMode.HAS_ASAR;
};
//# sourceMappingURL=asar-utils.js.map