#!/bin/bash
set -e

BUILD_DIR="build"
if [ ! -d "$BUILD_DIR" ]; then
    mkdir $BUILD_DIR
fi

# obtain channel (beta|release|mas)
CHANNEL="${1}"
if [ ! "$CHANNEL" ]; then
    echo "Update channel must be specified!"
    exit 1
fi

if [ "$CHANNEL" != "release" ] && [ "$CHANNEL" != "beta" ] && [ "$CHANNEL" != "mas" ]; then
    echo "$CHANNEL is an invalid value for the update channel!"
    exit 1
fi

# for faster build we can disable notarize
# ./build.sh beta --notarize=0
NOTARIZE_DISABLED="${2}"
if [ "$NOTARIZE_DISABLED" == "--notarize=0" ]; then
    echo "Build without notarize"
fi

echo "Building AdGuard, update channel $CHANNEL"

#
# Configuration
#

WORKSPACE="Adguard.xcworkspace"
CODE_SIGN_IDENTITY="Developer ID Application: Adguard Software Limited (TC3Q7MAJXF)"
ARCHIVE_NAME="Adguard for Safari.xcarchive"
ARCHIVE_PATH="$BUILD_DIR/$ARCHIVE_NAME"
APP_NAME="Adguard for Safari.app"
ARCHIVE_APP_PATH="$ARCHIVE_PATH/Products/Applications/$APP_NAME"
APP_PATH="$BUILD_DIR/$APP_NAME"
SCHEME="AdGuard"
APP_BUNDLE_ID="com.adguard.safari.AdGuard"
VERSION_FILE="version.txt"

CONFIGURATION_NAME="Release"
if [ "$CHANNEL" == "beta" ]; then
    CONFIGURATION_NAME="Standalone Beta"
    APP_NAME="Adguard for Safari Beta.app"
fi

if [ "$CHANNEL" == "release" ]; then
    CONFIGURATION_NAME="Standalone Prod"
fi

#
# Build process
#

echo "Step 1: Building the app archive"
rm -Rf "$ARCHIVE_PATH"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" archive -configuration "$CONFIGURATION_NAME" -archivePath "$ARCHIVE_PATH"

# zip the archive so that we could use it as a build artifact
/usr/bin/ditto -c -k --keepParent "$ARCHIVE_PATH" "$ARCHIVE_PATH.zip"

echo "Step 2: Copying the app to the build directory"
rm -Rf "$APP_PATH"
cp -HRfp "$ARCHIVE_APP_PATH" "$APP_PATH"

echo "Step 3: Modify the app update channel to $CHANNEL"
INFO_PLIST=${APP_PATH}/Contents/Info.plist

# retrieve version and build number from the app itself
build_number=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")
version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST")

echo "Step 4: Notarizing the app"
if [ "$NOTARIZE_DISABLED" == "--notarize=0" ]; then
    echo "Notarizing is disabled"
else
    # python script parameters should be relative to the script location
    python3 -u Scripts/notarize.py --path="../$APP_PATH" --bundle-id="$APP_BUNDLE_ID"
fi

echo "Step 5: Archive the app"
# zip the archive so that we could use it as a build artifact
/usr/bin/ditto -c -k --keepParent "$APP_PATH" "$APP_PATH.zip"

echo "Step 6: Build version.txt"
printf "version=$version\nbuild_number=$build_number\n" >$BUILD_DIR/$VERSION_FILE

echo "Step 7: Build updates json files"
# creates release.json and edits updates.json
buildFileName="Adguard for Safari.app.zip"
if [ "$CHANNEL" == "beta" ]; then
    buildFileName="Adguard for Safari Beta.app.zip"
fi

printf "{
  \"url\": \"https://static.adguard.com/safari/$CHANNEL/$buildFileName\",
  \"name\": \"$version-$build_number\",
  \"notes\": \"Updates\",
  \"pub_date\": \"$(date)\"
}" >$BUILD_DIR/release.json

curl "https://static.adguard.com/safari/updates-11.json" > $BUILD_DIR/updates.json

# python script parameters should be relative to the script location
python3 -u Scripts/update_version.py --path="../$BUILD_DIR/updates.json" --channel="$CHANNEL" --version="$version"


if [ "$CHANNEL" != "mas" ]; then
    exit 0;
fi

echo "Step 7: Upload archive to app store"
xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" -exportOptionsPlist ./Scripts/ExportOptions.plist -exportPath "$BUILD_DIR"