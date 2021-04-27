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

WORKSPACE="AdGuard.xcworkspace"
#CODE_SIGN_IDENTITY="Developer ID Application: Adguard Software Limited (TC3Q7MAJXF)"
APP_NAME="AdGuard for Safari.app"
APP_ARCHIVE_NAME="AdGuard_Safari.app.zip"
APP_BETA_ARCHIVE_NAME="AdGuard_Safari_Beta.app.zip"

ARCHIVE_NAME="AdGuard_Safari.xcarchive"
ARCHIVE_PATH="$BUILD_DIR/$ARCHIVE_NAME"
ARCHIVE_APP_PATH="$ARCHIVE_PATH/Products/Applications/$APP_NAME"
APP_PATH="$BUILD_DIR/$APP_NAME"

SCHEME="AdGuard"
APP_BUNDLE_ID="com.adguard.safari.AdGuard"
VERSION_FILE="version.txt"

CONFIGURATION_NAME="Release"
if [ "$CHANNEL" == "beta" ]; then
    CONFIGURATION_NAME="Standalone Beta"
fi

if [ "$CHANNEL" == "release" ]; then
    CONFIGURATION_NAME="Standalone Prod"
fi

#
# Build process
#

echo "Step 1: Building the app archives"
# download AdGuard resources
yarn install --cwd "${BUILD_DIR}/../AdGuardResources"

# build for x64 and arm64
rm -Rf "$ARCHIVE_PATH"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" archive -configuration "$CONFIGURATION_NAME" -arch x86_64 -arch arm64 -archivePath "$ARCHIVE_PATH"

# zip the archives so that we could use them as a build artifacts
zip -9 -r "$BUILD_DIR/AdGuard_Safari.xcarchive.zip" $ARCHIVE_PATH

echo "Step 2: Copying the apps to the build directory"
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
/usr/bin/ditto -c -k --keepParent "$APP_PATH" "$BUILD_DIR/$APP_ARCHIVE_NAME"

echo "Step 6: Build version.txt"
printf "version=$version\nbuild_number=$build_number\nchannel=$CHANNEL\n" >$BUILD_DIR/$VERSION_FILE

echo "Step 7: Build updates json files"
# creates release.json and edits updates.json
buildFileName=APP_ARCHIVE_NAME
if [ "$CHANNEL" == "beta" ]; then
    buildFileName=APP_BETA_ARCHIVE_NAME
fi

printf "{
  \"url\": \"https://static.adguard.com/safari/$CHANNEL/$buildFileName\",
  \"name\": \"$version-$build_number\",
  \"notes\": \"Updates\",
  \"pub_date\": \"$(date -u +%FT%TZ)\"
}" >$BUILD_DIR/release.json

curl "https://static.adguard.com/safari/updates.json" > $BUILD_DIR/updates.json

# python script parameters should be relative to the script location
python3 -u Scripts/update_version.py --path="../$BUILD_DIR/updates.json" --channel="$CHANNEL" --version="$version"
