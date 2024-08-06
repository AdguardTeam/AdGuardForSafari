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

bundle update fastlane

STEP=1
echo "Step $STEP: Remove local keychain if it exists"
bundle exec fastlane remove_certs config:"$CONFIGURATION_NAME"

let "STEP++"
echo "Step $STEP: Sync certificates and provisioning profiles"
bundle exec fastlane certs config:"$CONFIGURATION_NAME"

#
# Build process
#

let "STEP++"
echo "Step $STEP: Building the app archives"
# download AdGuard resources
yarn install --cwd "${BUILD_DIR}/../AdGuardResources"

# build for x64 and arm64
rm -Rf "$ARCHIVE_PATH"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" archive -configuration "$CONFIGURATION_NAME" -arch x86_64 -arch arm64 -archivePath "$ARCHIVE_PATH"

# zip the archives so that we could use them as a build artifacts
/usr/bin/ditto -c -k --keepParent "$ARCHIVE_PATH" "$ARCHIVE_PATH.zip"

let "STEP++"
echo "Step $STEP: Copying the apps to the build directory"
rm -Rf "$APP_PATH"
cp -HRfp "$ARCHIVE_APP_PATH" "$APP_PATH"

let "STEP++"
echo "Step $STEP: Modify the app update channel to $CHANNEL"
INFO_PLIST=${APP_PATH}/Contents/Info.plist

# retrieve version and build number from the app itself
build_number=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")
version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST")

let "STEP++"
echo "Step $STEP: Notarizing the app"
if [ "$NOTARIZE_DISABLED" == "--notarize=0" ]; then
    echo "Notarizing is disabled"
else
    # parameters should be relative to the $BUILD_DIR location
    bundle exec fastlane notari config:"$CONFIGURATION_NAME" bundle:"$APP_NAME" id:"$APP_BUNDLE_ID.$CHANNEL"
fi

let "STEP++"
echo "Step $STEP: Archive the app"
# zip the archive so that we could use it as a build artifact
/usr/bin/ditto -c -k --keepParent "$APP_PATH" "$BUILD_DIR/$APP_ARCHIVE_NAME"

let "STEP++"
echo "Step $STEP: Build version.txt"
printf "version=$version\nbuild_number=$build_number\nchannel=$CHANNEL\n" >$BUILD_DIR/$VERSION_FILE

let "STEP++"
echo "Step $STEP: Build updates json files"
# creates release.json and edits updates.json
buildFileName="${APP_ARCHIVE_NAME}"
if [ "$CHANNEL" == "beta" ]; then
    buildFileName="${APP_BETA_ARCHIVE_NAME}"
fi

printf "{
  \"url\": \"https://static.adtidy.org/safari/$CHANNEL/$buildFileName\",
  \"name\": \"$version-$build_number\",
  \"notes\": \"Updates\",
  \"pub_date\": \"$(date -u +%FT%TZ)\"
}" >$BUILD_DIR/release.json

curl "https://static.adtidy.org/safari/updates.json" > $BUILD_DIR/updates.json

# python script parameters should be relative to the script location
python3 -u Scripts/update_version.py --path="../$BUILD_DIR/updates.json" --channel="$CHANNEL" --version="$version"

let "STEP++"
echo "Step $STEP: Remove local keychain"
bundle exec fastlane remove_certs config:"$CONFIGURATION_NAME"
