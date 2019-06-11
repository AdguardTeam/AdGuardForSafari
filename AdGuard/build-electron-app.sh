#!/bin/bash

echo "Building electron app with config:"
echo "CONFIGURATION: ${CONFIGURATION}"
echo "AG_STANDALONE: ${AG_STANDALONE}"
echo "AG_STANDALONE_BETA: ${AG_STANDALONE_BETA}"

# Fix nvm incompatibility
. ~/.nvm/nvm.sh
nvm use v8.9.4 || exit 1

# Installing dependencies
#npm install -g electron-osx-sign
#npm install -g node-gyp
npm install -g electron-userland/electron-osx-sign#timestamp-server

PLATFORM=mas
ARCH=x64

SRC="${SRCROOT}/../ElectronMainApp"
SHAREDSRC="${SRCROOT}/../Shared"

# Cleaning safari-ext
if [ ${ACTION} == "clean" ]; then
cd "${SHAREDSRC}"
node-gyp clean || exit 1
exit 0
fi

# Rebuild safari-ext
#cd "${SHAREDSRC}"
#node-gyp configure --verbose --debug|| exit 1
#node-gyp rebuild --verbose|| exit 1
#

mkdir -vp "${SRC}/safari-ext/shared"
cp -v "${BUILT_PRODUCTS_DIR}/libshared.a" "${SRC}/safari-ext/shared/" || exit 1
rsync -avm --include='*.h' -f 'hide,! */' "${SHAREDSRC}/" "${SRC}/safari-ext/shared/"

# Update package.json
sed -i "" "s/AG_STANDALONE_BETA/${AG_STANDALONE_BETA}/g" "${SRC}/package.json"
sed -i "" "s/AG_STANDALONE_BUILD/${AG_STANDALONE}/g" "${SRC}/package.json"

# Rebuild electron app
OPT=""
cd "${SRC}"
if [ ${CONFIGURATION} != "Debug" ]; then
OPT="--asar"
yarn install --force || exit 1
else
#echo "skip"
yarn upgrade --force -P safari-ext || exit 1
fi

# Rebuild safari-ext and other node packages
#Run this binary file to rebuild node packages for electron
"${SRC}/node_modules/.bin/electron-rebuild"


codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "${SRC}/node_modules/safari-ext/build/Release/safari_ext_addon.node"

PACKAGER_PLATFORM="mas"
if [ ${AG_STANDALONE} == "true" ]; then
echo "Changing standalone build platform"
PACKAGER_PLATFORM="darwin"
fi

electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=2.0.17 --platform=${PACKAGER_PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
--arch=${ARCH} --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --overwrite --out="${TARGET_TEMP_DIR}" \
${OPT} || exit 1

APP="${TARGET_TEMP_DIR}/${PRODUCT_NAME}-${PACKAGER_PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
FRAMEWORKS="${APP}/Contents/Frameworks"

# Sign electron app
echo "Signing build"
#codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP" || exit 1
electron-osx-sign "${APP}" --platform=${PLATFORM} --timestamp="" --type=distribution --hardened-runtime --identity="${CODE_SIGN_IDENTITY}" --entitlements="${AG_ELECTRON_CHILD_ENT}" || exit 1

codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Electron Framework" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Libraries/libnode.dylib" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper EH.app" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper NP.app" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/${PRODUCT_NAME} Helper.app" || exit 1

if [ ${AG_STANDALONE} == "true" ]; then
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework/Versions/A/Resources/crashpad_handler" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Electron Framework.framework" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework/Versions/A/Resources/ShipIt" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_CHILD_ENT}" "$FRAMEWORKS/Squirrel.framework" || exit 1
codesign --verbose --force --deep -o runtime --timestamp --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_APP_ENT}" "$APP/Contents/MacOS/AdGuard for Safari" || exit 1
fi

if [ ${AG_STANDALONE} != "true" ]; then
codesign --verbose --force --sign "${CODE_SIGN_IDENTITY}" --entitlements "${AG_ELECTRON_LOGINHELPER_ENT}" "${APP}/Contents/Library/LoginItems/${PRODUCT_NAME} Login Helper.app" || exit 1
fi

# Move products
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

# Update package.json
sed -i "" "s/\"standalone-build\": \"${AG_STANDALONE}\"/\"standalone-build\": \"AG_STANDALONE_BUILD\"/g" "${SRC}/package.json"
sed -i "" "s/\"standalone-beta\": \"${AG_STANDALONE_BETA}\"/\"standalone-beta\": \"AG_STANDALONE_BETA\"/g" "${SRC}/package.json"

