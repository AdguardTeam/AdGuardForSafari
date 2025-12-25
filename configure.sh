#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/bin:$PATH"

if [ "$1" == "dev" ]; then
    ENV_NAME=Development
else
    ENV_NAME=Production
fi
echo "==== Configure environment for: $ENV_NAME ===="
echo

bundle config --local path '.bundle/vendor'
bundle config unset --local without

if [ "$1" != "dev" ]; then
    bundle config set --local without 'development'
fi

bundle install

if [ ! ${bamboo_no_need_private_vars} ]; then
    source ../adguard-mini-private/config.env

    pushd fastlane
    rm -rf keychain
    git clone $KEYCHAIN_GIT
    popd

    bundle exec fastlane create_sens_config
fi

# Activate python venv and install components
echo
echo "Configure Python"
echo
source "`dirname $0`/Support/Scripts/include/configure_python.inc"

if [ "$1" == "dev" ]; then
    # Install protoc tools
    "`dirname $0`/Support/Scripts/install_protoc_tools.sh"

    # syncs certificates for `MAS` distribution
    bundle exec fastlane certs config:MAS
    # syncs certificates for `Standalone` distribution
    bundle exec fastlane certs config:Debug
fi
