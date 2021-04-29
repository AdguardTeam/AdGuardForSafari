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
LOGINS="${APP_PATH}/Contents/Library/LoginItems"

echo "Signing build"

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "${RESOURCES}/libs/ConverterTool" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "${RESOURCES}/app-x64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "${RESOURCES}/app-arm64.asar.unpacked/node_modules/safari-ext/build/Release/safari_ext_addon.node" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libEGL.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libGLESv2.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Helpers/chrome_crashpad_handler" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/ReactiveObjC.framework/Versions/A/ReactiveObjC" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/ReactiveObjC.framework" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Mantle.framework/Versions/A/Mantle" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Mantle.framework" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework/Versions/A/Resources/ShipIt" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (GPU).app" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Plugin).app" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper (Renderer).app" || exit 1

codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_LOGINHELPER_ENT}" "${LOGINS}/AdGuard Login Helper.app/Contents/MacOS/AdGuard Login Helper" || exit 1
codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_LOGINHELPER_ENT}" "${LOGINS}/AdGuard Login Helper.app" || exit 1

# DO NOT sign main app binary and bundle, because it will be signed by xCode on the final stage
#    codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$APP_PATH/Contents/MacOS/${PRODUCT_NAME}" || exit 1
#    codesign --verbose --force -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP_PATH" || exit 1

