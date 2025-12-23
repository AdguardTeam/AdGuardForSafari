#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

#
#  packDebugProduct.sh
#  AdguardMini
#

set -e

cd "$(dirname "$0")/..";

PRODUCT_NAME="AdguardMini"
DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData"

# Build
xcodebuild clean build -scheme "$PRODUCT_NAME" -target Debug

BUILD_FOLDER="$DERIVED_DATA_PATH/$(ls -rt $DERIVED_DATA_PATH | grep "$PRODUCT_NAME" | tail -1)/Build/Products/Debug"

pushd "$BUILD_FOLDER"
zip -r "$PRODUCT_NAME.zip" "$PRODUCT_NAME.app"
popd
mv "$BUILD_FOLDER/$PRODUCT_NAME.zip" "$PRODUCT_NAME.zip"

open -a Finder .
