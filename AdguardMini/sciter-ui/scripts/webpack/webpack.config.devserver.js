// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

const path = require('path');
const devConfig = require('./webpack.config.dev');
const { merge } = require('webpack-merge');
const bodyParser = require('body-parser');
const { FRONTEND_DIST_PATH: distPath } = require('@adg/sciter-infra-utils/consts/common');
const assignRoutes = require('@adg/sciter-infra-utils/lib/web/express/assignJsonFileRoutes');

const ROOT_PATH = path.join(__dirname, '..', '..');
const REQUEST_PATH = '/dummyBackend/storageSource';
const STORAGE_PATH = path.join(ROOT_PATH, REQUEST_PATH);

module.exports = function() {
  return merge(devConfig.apply(undefined, arguments), {
        devServer: {
            static: {
                directory: path.join(ROOT_PATH, distPath),
                publicPath: '/'
            },
            // Read/write storage.json from web
            setupMiddlewares(middlewares, devServer) {
                devServer.app.use(bodyParser.json());
                assignRoutes(devServer.app, REQUEST_PATH, STORAGE_PATH);

                return middlewares;
            },
        },
        resolve: {
          alias: {
              'SciterPolyfills': path.join(__dirname, '..', 'devserver-modules', 'sciterPolyfills.ts')
          }
        }
    });
};
