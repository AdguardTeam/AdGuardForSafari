#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Use not system ruby
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/bin:$PATH"

CONFIGURATION="${1}"

cd "${SRCROOT}/.."

if [ "${bamboo_agentId}" ]; then
    [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh";
    nvm use 22;
fi

bundle exec fastlane build_sciter_ui config:"${CONFIGURATION}"
