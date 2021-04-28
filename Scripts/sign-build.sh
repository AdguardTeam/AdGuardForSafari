#!/bin/bash

APP_NAME="${PRODUCT_NAME}.app"
DST_DIR="${BUILT_PRODUCTS_DIR}"
if [[ ${ACTION} == "install" ]]; then
  DST_DIR="${INSTALL_ROOT}/Applications/"
  mkdir -p "${DST_DIR}"
fi
APP_PATH="$DST_DIR/$APP_NAME"

PLATFORM="mas"

FRAMEWORKS="${APP_PATH}/Contents/Frameworks"
RESOURCES="${APP_PATH}/Contents/Resources"

echo "Signing build"

if [[ ${CONFIGURATION} == "Release" ]]; then
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "${RESOURCES}/libs/ConverterTool" || exit 1

  electron-osx-sign "${APP}" --platform=${PLATFORM} --type=distribution --hardened-runtime --version=${ELECTRON_VERSION} --identity="${CODE_SIGN_IDENTITY}" --entitlements="${AG_APP_ENT}" || exit 1

  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (GPU).app" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Plugin).app" || exit 1
  codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Renderer).app" || exit 1

else
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${RESOURCES}/libs/ConverterTool" || exit 1

  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${RESOURCES}/app-x64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${RESOURCES}/app-arm64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1

  # electron-osx-sign "${APP_PATH}" --platform=${PLATFORM} --timestamp="" --type=distribution --hardened-runtime --identity="${CODE_SIGN_IDENTITY}" --entitlements="${AG_APP_ENT}" || exit 1

  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (GPU).app" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Plugin).app" || exit 1
  codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Renderer).app" || exit 1

  if [[ ${AG_STANDALONE} == "true" ]]; then
    codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
    codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework/Versions/A/Resources/ShipIt" || exit 1
    codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework" || exit 1
    codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP_PATH/Contents/MacOS/AdGuard for Safari" || exit 1

    # Not --deep, that do not touch plugins (Extensions)
    codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP_PATH" || exit 1
  fi
fi
