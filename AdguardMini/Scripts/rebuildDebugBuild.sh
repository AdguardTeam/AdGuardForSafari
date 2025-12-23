#!/bin/sh

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

#
#  rebuildDebugBuild.sh
#  AdguardMini
#

set -e

cd "$(dirname "$0")/..";

PRODUCT_NAME="Adguard Mini"
PROJECT_NAME="AdguardMini"
DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData"
LAST_BUILD_FOLDER=""
RESOURCES_FILE="resources.bin"
RESOURCES_PATH="SciterResources/$RESOURCES_FILE"

# Check that DerivedData exists
if [[ -d "$DERIVED_DATA_PATH" ]]; then
  LAST_BUILD_FOLDER=$(ls -rt $DERIVED_DATA_PATH | grep "$PROJECT_NAME" | tail -1)
fi

# Cannot find the last build folder, make a new build
if [[ -z "$LAST_BUILD_FOLDER" ]]; then
  xcodebuild -scheme "$PROJECT_NAME" -target Debug

  # Update build path here
  LAST_BUILD_FOLDER=$(ls -rt $DERIVED_DATA_PATH | grep "$PROJECT_NAME" | tail -1)
fi

# Close app
osascript -e "tell application \"$PROJECT_NAME\" to quit"

# Regenerate bundle
./Scripts/generateUI.sh

# Copy bundle to last build folder
cp "$RESOURCES_PATH" "$DERIVED_DATA_PATH/$LAST_BUILD_FOLDER/Build/Products/Debug/$PRODUCT_NAME.app/Contents/Resources/$RESOURCES_FILE"

# Then start it again
open -a "$DERIVED_DATA_PATH/$LAST_BUILD_FOLDER/Build/Products/Debug/$PRODUCT_NAME.app"
