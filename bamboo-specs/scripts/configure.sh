#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

pushd "$(dirname $0)/../../"

./bamboo-specs/scripts/setup_ssh.sh
./configure.sh

popd
