#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -ex

# Sparkle is not sandboxed, need to remove it for deployment to the AppStore

if [ ${CONFIGURATION} != "MAS" ]; then
    echo "Detected native configuration: ${CONFIGURATION}"

    SPARKLE_PATH="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/Sparkle.framework"

    rm -Rf "${SPARKLE_PATH}"
    cp -HRfpv "${BUILT_PRODUCTS_DIR}/Sparkle.framework" "${SPARKLE_PATH}" || exit 1
    echo "Embeded Sparkle frameworks."
    codesign --verbose --force --sign "$CODE_SIGN_IDENTITY" --options=runtime --timestamp --preserve-metadata=identifier,entitlements "${SPARKLE_PATH}" || exit 1
    echo "Signed Sparkle frameworks."
else
    echo "Detected MAS configuration."
fi
