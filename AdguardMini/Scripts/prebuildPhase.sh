#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

echo "Start Prebuild build phase"

echo "Built Product Dir: ${BUILT_PRODUCTS_DIR}"
"${BUILT_PRODUCTS_DIR}/AdguardMini Prebuilder"
