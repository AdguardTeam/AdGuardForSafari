#!/bin/bash

#  build-electron-app.sh
#  AdGuard
#
#  Created by Roman Sokolov on 14.08.2018.
#  Copyright © 2018 Adguard Software Ltd. All rights reserved.

PLATFORM=mas
ARCH=x64

SRC="${SRCROOT}/../ElectronMainApp"
SHAREDSRC="${SRCROOT}/../Shared"

if [ ${ACTION} == "clean" ]; then
cd "${SHAREDSRC}"
node-gyp clean || exit 1
exit 0
fi

#cd "${SHAREDSRC}"
#node-gyp configure --verbose --debug|| exit 1
#node-gyp rebuild --verbose|| exit 1
#
mkdir -vp "${SRC}/safari-ext/shared"
cp -v "${BUILT_PRODUCTS_DIR}/libshared.a" "${SRC}/safari-ext/shared/" || exit 1
rsync -avm --include='*.h' -f 'hide,! */' "${SHAREDSRC}/" "${SRC}/safari-ext/shared/"


OPT=""
cd "${SRC}"
if [ ${CONFIGURATION} == "Release" ]; then
OPT="--asar"
yarn install --force || exit 1
else
yarn upgrade --force -P safari-ext || exit 1
fi

#Run this binary file to rebuild node packages for electron
"${SRC}/node_modules/.bin/electron-rebuild"

codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${SRC}/node_modules/safari-ext/build/Release/safari_ext_addon.node"

electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=2.0.12 --platform=${PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
--arch=${ARCH} --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --overwrite --out="${TARGET_TEMP_DIR}" \
${OPT} || exit 1

APP="${TARGET_TEMP_DIR}/${PRODUCT_NAME}-${PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
FRAMEWORKS="${APP}/Contents/Frameworks"

codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libnode.dylib" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper EH.app" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper NP.app" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_LOGINHELPER_ENT}" "${APP}/Contents/Library/LoginItems/${PRODUCT_NAME} Login Helper.app" || exit 1

DST_DIR="${BUILT_PRODUCTS_DIR}"
if [ ${ACTION} == "install" ]; then
DST_DIR="${INSTALL_ROOT}/Applications/"
mkdir -p "${DST_DIR}"
fi


rm -Rfv "${DST_DIR}/${PRODUCT_NAME}.app"
cp -HRfp "${APP}" "${DST_DIR}" || exit 1



#  Touch native part of the project
touch -c "${SRCROOT}/Assets.xcassets"
touch -c "${SRCROOT}/AdGuard/Info.plist"
touch -c "${SRCROOT}/defaults.plist"
