#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

# Determine the directory where this script stores
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Source folder: one level up from script_dir, then into XcodeTemplates/AdGuardMini related
SRC_DIR="${SCRIPT_DIR}/../XcodeTemplates/AdGuardMini related"
DEST_DIR=~/Library/Developer/Xcode/Templates/

cp -r -v "${SRC_DIR}" "${DEST_DIR}"
