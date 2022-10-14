#!/bin/bash

ELECTRON="ElectronMainApp"
SRC="${SRCROOT}/../${ELECTRON}"
SHAREDSRC="${SRCROOT}/../Shared"
APP_NAME="${PRODUCT_NAME}.app"
APP="${TARGET_TEMP_DIR}/${APP_NAME}"

TIME_MARKER="${TARGET_TEMP_DIR}/ElectronTimeMarker.touch"

[ -f "$TIME_MARKER" ] && /usr/bin/find "${SRC}/" -newer "${TIME_MARKER}" | grep ${ELECTRON} > /dev/null

# save last result in temp variable to be able to call set -e later,
# otherwise set -e forces program to exit when grep doesn't find anythink
SEARCH_RESULT=$?

set -e

if [[ $SEARCH_RESULT == 0 ]] || ! [ -f "$TIME_MARKER" ]; then
    echo "Rebuild electron started"

    mkdir -p $TARGET_TEMP_DIR/arm64
    mkdir -p $TARGET_TEMP_DIR/x86_64


    mkdir -vp "${SRC}/safari-ext/shared"
    cp -v "${BUILT_PRODUCTS_DIR}/libshared.a" "${SRC}/safari-ext/shared/" || exit 1
    rsync -avm --include='*.h' -f 'hide,! */' "${SHAREDSRC}/" "${SRC}/safari-ext/shared/"

    # TODO figure out how not to depend on the order of builds
    echo "Build electron app for x86_64"
    bash ../Scripts/build-electron-app-one-arch.sh x86_64 "$TARGET_TEMP_DIR/x86_64" || exit 1

    echo "Build electron app for arm64"
    bash ../Scripts/build-electron-app-one-arch.sh arm64 "$TARGET_TEMP_DIR/arm64" || exit 1

    echo "Create universal build"
    cd ../ElectronMainApp
    yarn make-universal-app "$TARGET_TEMP_DIR" "$AG_STANDALONE"

    touch "${TIME_MARKER}"

    echo "Copy converter binary"
    mkdir -p "${SRC}/../libs"
    cp "${SRC}/node_modules/safari-converter-lib/bin/ConverterTool" "${SRC}/../libs" || exit 1
    chmod +x "${SRC}/../libs/ConverterTool"

    echo "Processing ConverterTool"
    install_name_tool -add_rpath @executable_path/../Frameworks "${SRC}/../libs/ConverterTool" > /dev/null 2>&1 | echo -n
    install_name_tool -add_rpath @executable_path/../../Frameworks "${SRC}/../libs/ConverterTool" > /dev/null 2>&1 | echo -n

    echo "Hide executable file from xcodebuild"
    mv -f "$APP/Contents/MacOS/${PRODUCT_NAME}" "$APP/Contents/MacOS/${AG_HIDE_EXEC_PREFIX}${PRODUCT_NAME}" || exit 1

fi

echo "Copying electron app to: ${DST_DIR}"

DST_DIR="${BUILT_PRODUCTS_DIR}"
if [[ ${ACTION} == "install" ]]; then
  DST_DIR="${INSTALL_ROOT}/Applications/"
  mkdir -p "${DST_DIR}"
fi

rm -Rfv "${DST_DIR}/${APP_NAME}"
cp -HRfpv "${APP}" "${DST_DIR}"

# Get rid of redundant asar files (need only one app.asar):
# for the moment app.asar is path resolver for app-x64.asar and app-arm64.asar, that we don't need
rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"
# we had run electron-packager for both architectures so asar files for x64 and arm64 are similar
# and we can remove one of them and rename other one to app.asar
rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app-x64.asar"
mv "${DST_DIR}/${APP_NAME}/Contents/Resources/app-arm64.asar" "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"

cd ../AdGuard
