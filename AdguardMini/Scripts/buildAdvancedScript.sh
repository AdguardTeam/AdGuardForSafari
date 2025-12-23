#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

# Use not system ruby
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/bin:$PATH"

cd "${SRCROOT}/PopupExtension/ContentScript"

if [ ${bamboo_agentId} ]; then
    [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
    nvm use 22
fi

yarn install
yarn build "${AGP_ADVANCED_SCRIPT_FILE}"
