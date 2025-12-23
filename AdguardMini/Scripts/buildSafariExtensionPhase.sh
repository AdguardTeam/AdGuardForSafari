#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

echo "Start Build Safari Extension resources phase"

# Create Prepared resources directory if needed
mkdir -p "${AGP_PREPARED_RESOURCES_DIR}"

echo "Prepared resources: ${AGP_PREPARED_RESOURCES_DIR}"
echo "Channel: ${AG_CHANNEL}"
echo "Builder path: ${BUILT_PRODUCTS_DIR}/SafariExtension Builder"

# Check if builder exists
if [ ! -f "${BUILT_PRODUCTS_DIR}/SafariExtension Builder" ]; then
    echo "ERROR: SafariExtension Builder not found at ${BUILT_PRODUCTS_DIR}/SafariExtension Builder"
    exit 1
fi

echo "Running SafariExtension Builder..."
"${BUILT_PRODUCTS_DIR}/SafariExtension Builder" --$AG_CHANNEL "${AGP_PREPARED_RESOURCES_DIR}" 2>&1 || {
    echo "ERROR: SafariExtension Builder failed with exit code $?"
    exit 1
}
