#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -ex

LOCALIZATION_PATH="$1"

${BUILT_PRODUCTS_DIR}/generate_strings_tables \
    "${SOURCE_ROOT}/${TARGET_NAME}" \
    "${LOCALIZATION_PATH}" \
    --use-spdx-header "${AGP_SPDX_LICENSE}"
