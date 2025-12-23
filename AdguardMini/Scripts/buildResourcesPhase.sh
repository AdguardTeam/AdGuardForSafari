#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

echo "Start Build resources build phase"

echo "Built Product Dir: ${BUILT_PRODUCTS_DIR}"
"${BUILT_PRODUCTS_DIR}/AdguardMini Builder" --$AG_CHANNEL "${BUILT_PRODUCTS_DIR}"

RESOURCES="${BUILT_PRODUCTS_DIR}/${CONTENTS_FOLDER_PATH}/Resources/"

echo "Copying resources..."

cp -Rv "${BUILT_PRODUCTS_DIR}/${AG_DEFAULT_FILTERSDB_DIRNAME}" "${RESOURCES}"
