#!/bin/bash

set -e

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
LOGINS="${APP_PATH}/Contents/Library/LoginItems"

echo "Signing build"

if [[ ${AG_STANDALONE} == "true" ]]; then
RT_OPTIONS=" -o runtime"
fi

SIGN_OPTIONS="--verbose=2 --force$RT_OPTIONS --timestamp --entitlements $AG_ELECTRON_CHILD_ENT"

codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "${RESOURCES}/libs/ConverterTool" || exit 1

codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "${RESOURCES}/app-x64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "${RESOURCES}/app-arm64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1

codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libEGL.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libGLESv2.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework" || exit 1

codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (GPU).app" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Plugin).app" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Renderer).app" || exit 1

if [[ ${AG_STANDALONE} == "true" ]]; then
  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Helpers/chrome_crashpad_handler" || exit 1

  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/ReactiveObjC.framework/Versions/A/ReactiveObjC" || exit 1
  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/ReactiveObjC.framework" || exit 1

  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Mantle.framework/Versions/A/Mantle" || exit 1
  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Mantle.framework" || exit 1

  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Squirrel.framework/Versions/A/Resources/ShipIt" || exit 1
  codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "$FRAMEWORKS/Squirrel.framework" || exit 1
fi

SIGN_OPTIONS="--verbose=2 --force$RT_OPTIONS --timestamp --entitlements $AG_ELECTRON_LOGINHELPER_ENT"

codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "${LOGINS}/AdGuard Login Helper.app/Contents/MacOS/AdGuard Login Helper" || exit 1
codesign $SIGN_OPTIONS --sign "${CODE_SIGN_IDENTITY}" "${LOGINS}/AdGuard Login Helper.app" || exit 1

# DO NOT sign main app binary and bundle, because it will be signed by xCode on the final stage
