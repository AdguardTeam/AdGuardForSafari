"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeUniversalApp = void 0;
const cross_spawn_promise_1 = require("@malept/cross-spawn-promise");
const asar = require("asar");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const dircompare = require("dir-compare");
const file_utils_1 = require("./file-utils");
const asar_utils_1 = require("./asar-utils");
const sha_1 = require("./sha");
const debug_1 = require("./debug");
const dupedFiles = (files) => files.filter((f) => f.type !== file_utils_1.AppFileType.SNAPSHOT && f.type !== file_utils_1.AppFileType.APP_CODE);
exports.makeUniversalApp = async (opts) => {
    debug_1.d('making a universal app with options', opts);
    if (process.platform !== 'darwin')
        throw new Error('@electron/universal is only supported on darwin platforms');
    if (!opts.x64AppPath || !path.isAbsolute(opts.x64AppPath))
        throw new Error('Expected opts.x64AppPath to be an absolute path but it was not');
    if (!opts.arm64AppPath || !path.isAbsolute(opts.arm64AppPath))
        throw new Error('Expected opts.arm64AppPath to be an absolute path but it was not');
    if (!opts.outAppPath || !path.isAbsolute(opts.outAppPath))
        throw new Error('Expected opts.outAppPath to be an absolute path but it was not');
    if (await fs.pathExists(opts.outAppPath)) {
        debug_1.d('output path exists already');
        if (!opts.force) {
            throw new Error(`The out path "${opts.outAppPath}" already exists and force is not set to true`);
        }
        else {
            debug_1.d('overwriting existing application because force == true');
            await fs.remove(opts.outAppPath);
        }
    }
    const x64AsarMode = await asar_utils_1.detectAsarMode(opts.x64AppPath);
    const arm64AsarMode = await asar_utils_1.detectAsarMode(opts.arm64AppPath);
    debug_1.d('detected x64AsarMode =', x64AsarMode);
    debug_1.d('detected arm64AsarMode =', arm64AsarMode);
    if (x64AsarMode !== arm64AsarMode)
        throw new Error('Both the x64 and arm64 versions of your application need to have been built with the same asar settings (enabled vs disabled)');
    const tmpDir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-universal-'));
    debug_1.d('building universal app in', tmpDir);
    try {
        debug_1.d('copying x64 app as starter template');
        const tmpApp = path.resolve(tmpDir, 'Tmp.app');
        await cross_spawn_promise_1.spawn('cp', ['-R', opts.x64AppPath, tmpApp]);
        const uniqueToX64 = [];
        const uniqueToArm64 = [];
        const x64Files = await file_utils_1.getAllAppFiles(await fs.realpath(tmpApp));
        const arm64Files = await file_utils_1.getAllAppFiles(await fs.realpath(opts.arm64AppPath));
        for (const file of dupedFiles(x64Files)) {
            if (!arm64Files.some((f) => f.relativePath === file.relativePath))
                uniqueToX64.push(file.relativePath);
        }
        for (const file of dupedFiles(arm64Files)) {
            if (!x64Files.some((f) => f.relativePath === file.relativePath))
                uniqueToArm64.push(file.relativePath);
        }
        if (uniqueToX64.length !== 0 || uniqueToArm64.length !== 0) {
            debug_1.d('some files were not in both builds, aborting');
            console.error({
                uniqueToX64,
                uniqueToArm64,
            });
            throw new Error('While trying to merge mach-o files across your apps we found a mismatch, the number of mach-o files is not the same between the arm64 and x64 builds');
        }
        // for (const file of x64Files.filter((f) => f.type === file_utils_1.AppFileType.PLAIN)) {
        //     const x64Sha = await sha_1.sha(path.resolve(opts.x64AppPath, file.relativePath));
        //     const arm64Sha = await sha_1.sha(path.resolve(opts.arm64AppPath, file.relativePath));
        //     if (x64Sha !== arm64Sha) {
        //         debug_1.d('SHA for file', file.relativePath, `does not match across builds ${x64Sha}!=${arm64Sha}`);
        //         throw new Error(`Expected all non-binary files to have identical SHAs when creating a universal build but "${file.relativePath}" did not`);
        //     }
        // }
        for (const machOFile of x64Files.filter((f) => f.type === file_utils_1.AppFileType.MACHO)) {
            const first = await fs.realpath(path.resolve(tmpApp, machOFile.relativePath));
            const second = await fs.realpath(path.resolve(opts.arm64AppPath, machOFile.relativePath));
            debug_1.d('joining two MachO files with lipo', {
                first,
                second,
            });
            await cross_spawn_promise_1.spawn('lipo', [
                first,
                second,
                '-create',
                '-output',
                await fs.realpath(path.resolve(tmpApp, machOFile.relativePath)),
            ]);
        }
        /**
         * If we don't have an ASAR we need to check if the two "app" folders are identical, if
         * they are then we can just leave one there and call it a day.  If the app folders for x64
         * and arm64 are different though we need to rename each folder and create a new fake "app"
         * entrypoint to dynamically load the correct app folder
         */
        if (x64AsarMode === asar_utils_1.AsarMode.NO_ASAR) {
            debug_1.d('checking if the x64 and arm64 app folders are identical');
            const comparison = await dircompare.compare(path.resolve(tmpApp, 'Contents', 'Resources', 'app'), path.resolve(opts.arm64AppPath, 'Contents', 'Resources', 'app'), { compareSize: true, compareContent: true });
            if (!comparison.same) {
                debug_1.d('x64 and arm64 app folders are different, creating dynamic entry ASAR');
                await fs.move(path.resolve(tmpApp, 'Contents', 'Resources', 'app'), path.resolve(tmpApp, 'Contents', 'Resources', 'app-x64'));
                await fs.copy(path.resolve(opts.arm64AppPath, 'Contents', 'Resources', 'app'), path.resolve(tmpApp, 'Contents', 'Resources', 'app-arm64'));
                const entryAsar = path.resolve(tmpDir, 'entry-asar');
                await fs.mkdir(entryAsar);
                await fs.copy(path.resolve(__dirname, '..', '..', 'entry-asar', 'no-asar.js'), path.resolve(entryAsar, 'index.js'));
                let pj = await fs.readJson(path.resolve(opts.x64AppPath, 'Contents', 'Resources', 'app', 'package.json'));
                pj.main = 'index.js';
                await fs.writeJson(path.resolve(entryAsar, 'package.json'), pj);
                await asar.createPackage(entryAsar, path.resolve(tmpApp, 'Contents', 'Resources', 'app.asar'));
            }
            else {
                debug_1.d('x64 and arm64 app folders are the same');
            }
        }
        /**
         * If we have an ASAR we just need to check if the two "app.asar" files have the same hash,
         * if they are, same as above, we can leave one there and call it a day.  If they're different
         * we have to make a dynamic entrypoint.  There is an assumption made here that every file in
         * app.asar.unpacked is a native node module.  This assumption _may_ not be true so we should
         * look at codifying that assumption as actual logic.
         */
        // FIXME: Codify the assumption that app.asar.unpacked only contains native modules
        if (x64AsarMode === asar_utils_1.AsarMode.HAS_ASAR) {
            debug_1.d('checking if the x64 and arm64 asars are identical');
            const x64AsarSha = await sha_1.sha(path.resolve(tmpApp, 'Contents', 'Resources', 'app.asar'));
            const arm64AsarSha = await sha_1.sha(path.resolve(opts.arm64AppPath, 'Contents', 'Resources', 'app.asar'));
            if (x64AsarSha !== arm64AsarSha) {
                debug_1.d('x64 and arm64 asars are different');
                await fs.move(path.resolve(tmpApp, 'Contents', 'Resources', 'app.asar'), path.resolve(tmpApp, 'Contents', 'Resources', 'app-x64.asar'));
                const x64Unpacked = path.resolve(tmpApp, 'Contents', 'Resources', 'app.asar.unpacked');
                if (await fs.pathExists(x64Unpacked)) {
                    await fs.move(x64Unpacked, path.resolve(tmpApp, 'Contents', 'Resources', 'app-x64.asar.unpacked'));
                }
                await fs.copy(path.resolve(opts.arm64AppPath, 'Contents', 'Resources', 'app.asar'), path.resolve(tmpApp, 'Contents', 'Resources', 'app-arm64.asar'));
                const arm64Unpacked = path.resolve(opts.arm64AppPath, 'Contents', 'Resources', 'app.asar.unpacked');
                if (await fs.pathExists(arm64Unpacked)) {
                    await fs.copy(arm64Unpacked, path.resolve(tmpApp, 'Contents', 'Resources', 'app-arm64.asar.unpacked'));
                }
                const entryAsar = path.resolve(tmpDir, 'entry-asar');
                await fs.mkdir(entryAsar);
                await fs.copy(path.resolve(__dirname, '..', '..', 'entry-asar', 'has-asar.js'), path.resolve(entryAsar, 'index.js'));
                let pj = JSON.parse((await asar.extractFile(path.resolve(opts.x64AppPath, 'Contents', 'Resources', 'app.asar'), 'package.json')).toString('utf8'));
                pj.main = 'index.js';
                await fs.writeJson(path.resolve(entryAsar, 'package.json'), pj);
                await asar.createPackage(entryAsar, path.resolve(tmpApp, 'Contents', 'Resources', 'app.asar'));
            }
            else {
                debug_1.d('x64 and arm64 asars are the same');
            }
        }
        for (const snapshotsFile of arm64Files.filter((f) => f.type === file_utils_1.AppFileType.SNAPSHOT)) {
            debug_1.d('copying snapshot file', snapshotsFile.relativePath, 'to target application');
            await fs.copy(path.resolve(opts.arm64AppPath, snapshotsFile.relativePath), path.resolve(tmpApp, snapshotsFile.relativePath));
        }
        debug_1.d('moving final universal app to target destination');
        await fs.mkdirp(path.dirname(opts.outAppPath));
        await cross_spawn_promise_1.spawn('mv', [tmpApp, opts.outAppPath]);
    }
    catch (err) {
        throw err;
    }
    finally {
        await fs.remove(tmpDir);
    }
};
//# sourceMappingURL=index.js.map
