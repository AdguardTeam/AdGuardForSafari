// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const getInlineConfig = require('@adg/sciter-infra-utils/configs/webpack/webpack.htmlInlineJs.config');


const paths = {
    output: path.resolve('./AdguardMini/sciter-ui/modules/inline'),
    rootPath: path.resolve('./'),
    commonPath: path.resolve('./AdguardMini/sciter-ui/modules/common')
};


module.exports = merge(getInlineConfig(paths.rootPath, './AdguardMini/sciter-ui/modules/userrules/index.tsx', paths.output) , {
    devServer: {
        static: {
            directory: path.output,
            publicPath: '/'
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            'translate': [path.join(paths.commonPath, 'intl', 'index.ts'), 'default'],
            'tx': [path.join(paths.commonPath, 'theme', 'index.ts'), 'default'],
            'cx': [path.join(path.join(paths.rootPath, 'node_modules'), 'classix', 'dist', 'esm', 'classix.mjs'), 'default']
        })
    ],
});