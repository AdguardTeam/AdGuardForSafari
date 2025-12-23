#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

if [ "$1" == "push" ]; then
    yarn locales:pushMaster
    ./Support/Scripts/localize.rb export -b
else
    yarn locales:pull
    ./Support/Scripts/localize.rb import -l all -b
fi
