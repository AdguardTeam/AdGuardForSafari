#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

if xcodebuild \
    -resolvePackageDependencies \
    -project AdguardMini/AdguardMini.xcodeproj \
    -scheme AdguardMini \
    -configuration Release \
    -derivedDataPath "build/derived_data" \
    > /dev/null; then
    echo "All Swift packages resolved correctly"
    exit 0
else
    echo "error: Some Swift packages failed to resolve, see the log above."
    echo "error: Potentially this is because the revision of the sp-sciter-sdk package has changed without changing the version, in this case you need to set the correct revision automatically by SPM tools or manually"
    exit 1
fi
