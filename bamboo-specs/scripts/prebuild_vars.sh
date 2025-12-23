#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

mkdir -p build

echo "Obtaining tag or commit hash for changelog from..."

if [ "${bamboo_changelog_tag_from}" == "latest@tag" ]; then
    echo "Changelog tag or commit hash was not specified! Trying obtain last tag..."
    git fetch --tags
    echo -n "tag_from=" > build/vars.txt
    echo $(git tag -l "*-${bamboo_update_channel}" --sort='-creatordate' | head -n 1) >> build/vars.txt
else
    echo "tag_from=${bamboo_changelog_tag_from}" > build/vars.txt
fi

echo "Prebuild Vars:"
cat build/vars.txt
