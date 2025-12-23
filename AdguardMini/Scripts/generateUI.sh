#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

#
#  generateUI.sh
#  AdguardMini
#

set -e

cd "$(dirname "$0")/..";

chmod u+x sciter-js-sdk/mac/packfolder

if [[ -d ./build ]]; then
  ./sciter-js-sdk/mac/packfolder build SciterResources/resources.bin -binary || exit 1
  echo "Resources created"
else
  echo "Directory build does not exist"
  exit 2
fi
