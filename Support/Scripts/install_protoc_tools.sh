#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

source "$SCRIPT_DIR/include/install_protoc_tools.inc"
install_protoc_tools
