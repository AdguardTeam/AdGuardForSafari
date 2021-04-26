#!/bin/bash

BUILD_DIR="build"
PRODUCT_NAME="AdGuard for Safari"
APP_NAME="${PRODUCT_NAME}.app"
APP_PATH="$BUILD_DIR/$APP_NAME"

CODE_SIGN_IDENTITY="Developer ID Application: Adguard Software Limited (TC3Q7MAJXF)"

SRCROOT="AdGuard"
AG_APP_ENT=${SRCROOT}/AdGuard/AdGuard.entitlements
AG_ELECTRON_CHILD_ENT=${SRCROOT}/AdGuard/ElectronChild.entitlements
PLATFORM="mas"

#APP="${2}/${PRODUCT_NAME}-${PACKAGER_PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
FRAMEWORKS="${APP_PATH}/Contents/Frameworks"
RESOURCES="${APP_PATH}/Contents/Resources"

echo "Step 4: Signing build"

#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${APP_PATH}/Contents/Resources/app-x64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node"
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${APP_PATH}/Contents/Resources/app-arm64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node"

#echo "Signing by electron-osx-sign"
#electron-osx-sign "${APP_PATH}" --platform=${PLATFORM} --timestamp="" --type=distribution --hardened-runtime --identity="${CODE_SIGN_IDENTITY}" --entitlements="${AG_APP_ENT}" || exit 1

echo "Signing by codesign"
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (GPU).app" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Plugin).app" || exit 1
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Renderer).app" || exit 1

#if [[ ${AG_STANDALONE} == "true" ]]; then
#  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
#  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework/Versions/A/Resources/ShipIt" || exit 1
#  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework" || exit 1
#  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP_PATH/Contents/MacOS/AdGuard for Safari" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP_PATH" || exit 1
#fi
