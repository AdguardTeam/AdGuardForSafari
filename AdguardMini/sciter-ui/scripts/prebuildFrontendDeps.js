/**
 * SPDX-FileCopyrightText: AdGuard Software Limited
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This module is used to build frontend deps before build
 */

const { spawnSync } = require('child_process');

try {
  const gitArgs = [
    'diff',
    '--quiet',
    '--exit-code',
    'HEAD',
    '--',
    'AdguardMini/sciter-ui/modules/userrules',
  ];

  const status = spawnSync('git', gitArgs, { stdio: 'ignore' }).status;

  // If there are changes in the userrules directory, build the frontend deps
  if (status !== 0) {
    process.exitCode = spawnSync('yarn', ['build:userRules'], { stdio: 'inherit' }).status;
  } else {
    process.exitCode = 0;
  }
} catch (err) {
  console.error('[prebuildFrontendDeps] Error:', err && err.message ? err.message : err);
  process.exitCode = 1;
}