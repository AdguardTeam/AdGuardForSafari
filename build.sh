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
CODE_SIGN_IDENTITY="Developer ID Application: Adguard Software Limited (TC3Q7MAJXF)"
APP_NAME="AdGuard for Safari.app"

X64_ARCHIVE_NAME="AdGuard_Safari_x64.xcarchive"
X64_ARCHIVE_PATH="$BUILD_DIR/$X64_ARCHIVE_NAME"
X64_APP_NAME="AdGuard for Safari x64.app"
X64_ARCHIVE_APP_PATH="$X64_ARCHIVE_PATH/Products/Applications/$APP_NAME"
X64_APP_PATH="$BUILD_DIR/$X64_APP_NAME"

ARM64_ARCHIVE_NAME="AdGuard_Safari_arm64.xcarchive"
ARM64_ARCHIVE_PATH="$BUILD_DIR/$ARM64_ARCHIVE_NAME"
ARM64_APP_NAME="AdGuard for Safari arm64.app"
ARM64_ARCHIVE_APP_PATH="$ARM64_ARCHIVE_PATH/Products/Applications/$APP_NAME"
ARM64_APP_PATH="$BUILD_DIR/$ARM64_APP_NAME"

SCHEME="AdGuard"
APP_BUNDLE_ID="com.adguard.safari.AdGuard"
VERSION_FILE="version.txt"

CONFIGURATION_NAME="Release"
if [ "$CHANNEL" == "beta" ]; then
    CONFIGURATION_NAME="Standalone Beta"
#    X64_APP_NAME="AdGuard for Safari Beta.app"
#    X64_APP_PATH="$BUILD_DIR/$X64_APP_NAME"
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

# build for x64
rm -Rf "$X64_ARCHIVE_PATH"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" archive -configuration "$CONFIGURATION_NAME" -archivePath "$X64_ARCHIVE_PATH" VALID_ARCHS=x86_64

# build for arm64
rm -Rf "$ARM64_ARCHIVE_PATH"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" archive -configuration "$CONFIGURATION_NAME" -archivePath "$ARM64_ARCHIVE_PATH" VALID_ARCHS=arm64 -destination 'platform=OS X'

# zip the archives so that we could use them as a build artifacts
/usr/bin/ditto -c -k --keepParent "$X64_ARCHIVE_PATH" "$X64_ARCHIVE_PATH.zip"
/usr/bin/ditto -c -k --keepParent "$ARM64_ARCHIVE_PATH" "$ARM64_ARCHIVE_PATH.zip"

echo "Step 2: Copying the apps to the build directory"
rm -Rf "$X64_APP_PATH"
cp -HRfp "$X64_ARCHIVE_APP_PATH" "$X64_APP_PATH"

rm -Rf "$ARM64_APP_PATH"
cp -HRfp "$ARM64_ARCHIVE_APP_PATH" "$ARM64_APP_PATH"

echo "Step 3: Modify the app update channel to $CHANNEL"
X64_INFO_PLIST=${X64_APP_PATH}/Contents/Info.plist
# ARM64_INFO_PLIST=${ARM64_APP_PATH}/Contents/Info.plist

# retrieve version and build number from the app itself
build_number=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$X64_INFO_PLIST")
version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$X64_INFO_PLIST")

echo "Step 4: Notarizing the app"
if [ "$NOTARIZE_DISABLED" == "--notarize=0" ]; then
    echo "Notarizing is disabled"
else
    # python script parameters should be relative to the script location
    python3 -u Scripts/notarize.py --path="../$X64_APP_PATH" --bundle-id="$APP_BUNDLE_ID"
    python3 -u Scripts/notarize.py --path="../$ARM64_APP_PATH" --bundle-id="$APP_BUNDLE_ID"
fi

echo "Step 5: Archive the app"
#zip the archive so that we could use it as a build artifact
/usr/bin/ditto -c -k --keepParent "$X64_APP_PATH" "$BUILD_DIR/AdGuard_Safari_x64.app.zip"
/usr/bin/ditto -c -k --keepParent "$ARM64_APP_PATH" "$BUILD_DIR/AdGuard_Safari_arm64.app.zip"

echo "Step 6: Build version.txt"
printf "version=$version\nbuild_number=$build_number\nchannel=$CHANNEL\n" >$BUILD_DIR/$VERSION_FILE

echo "Step 7: Build updates json files"
# creates release.json and edits updates.json
#buildFileName="AdGuard_Safari_x64.app.zip"
#if [ "$CHANNEL" == "beta" ]; then
#    buildFileName="AdGuard_Safari_Beta.app.zip"
#fi

#printf "{
#  \"url\": \"https://static.adguard.com/safari/$CHANNEL/$buildFileName\",
#  \"name\": \"$version-$build_number\",
#  \"notes\": \"Updates\",
#  \"pub_date\": \"$(date -u +%FT%TZ)\"
#}" >$BUILD_DIR/release.json
#
#curl "https://static.adguard.com/safari/updates.json" > $BUILD_DIR/updates.json

# python script parameters should be relative to the script location
#python3 -u Scripts/update_version.py --path="../$BUILD_DIR/updates.json" --channel="$CHANNEL" --version="$version"

echo "Step 8: Create the universal build"
cd ElectronMainApp
yarn make-universal-app
