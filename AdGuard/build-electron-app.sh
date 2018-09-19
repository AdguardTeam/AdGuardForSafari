#!/bin/bash

#  build-electron-app.sh
#  AdGuard
#
#  Created by Roman Sokolov on 14.08.2018.
#  Copyright © 2018 Roman Sokolov. All rights reserved.

PLATFORM=darwin
ARCH=x64

SRC="${SRCROOT}/../ElectronMainApp"
SHAREDSRC="${SRCROOT}/../Shared"

if [ ${1} == "clean" ]; then
rm -Rfv "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}-${PLATFORM}-${ARCH}" || exit 1
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

electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=2.0.8 --platform=${PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
--arch=${ARCH} --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --overwrite --out="${BUILT_PRODUCTS_DIR}" \
${OPT} || exit 1

APP="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}-${PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
FRAMEWORKS="${APP}/Contents/Frameworks"

CHILD_ENT="${SRCROOT}/${PRODUCT_NAME}/ElectronChild.entitlements"
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/Mantle.framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/ReactiveCocoa.framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/AdGuard Helper EH.app" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/AdGuard Helper NP.app" || exit 1
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${CHILD_ENT}" "$FRAMEWORKS/AdGuard Helper.app" || exit 1

rm -Rfv "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app"
cp -HRfp "${APP}" "${BUILT_PRODUCTS_DIR}" || exit 1
rm -Rfv "${APP}" || exit 1
