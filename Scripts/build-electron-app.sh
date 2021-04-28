#!/bin/bash

SRC="${SRCROOT}/../ElectronMainApp"

mkdir -p $TARGET_TEMP_DIR/arm64
mkdir -p $TARGET_TEMP_DIR/x86_64

echo "Build electron app for arm64"
bash ../Scripts/build-electron-app-one-arch.sh arm64 "$TARGET_TEMP_DIR/arm64"

echo "Build electron app for x86_64"
bash ../Scripts/build-electron-app-one-arch.sh x86_64 "$TARGET_TEMP_DIR/x86_64"

echo "Create universal build"
cd ../ElectronMainApp
yarn make-universal-app "$TARGET_TEMP_DIR"

echo "Copy converter binary"
mkdir -p "${SRC}/../libs"
cp "${SRC}/node_modules/safari-converter-lib/bin/ConverterTool" "${SRC}/../libs" || exit 1
chmod +x "${SRC}/../libs/ConverterTool"

echo "Processing ConverterTool"
install_name_tool -add_rpath @executable_path/../Frameworks "${SRC}/../libs/ConverterTool" > /dev/null 2>&1 | echo -n
install_name_tool -add_rpath @executable_path/../../Frameworks "${SRC}/../libs/ConverterTool" > /dev/null 2>&1 | echo -n

APP_NAME="${PRODUCT_NAME}.app"
APP="${TARGET_TEMP_DIR}/${APP_NAME}"

echo "Hide executable file from xcodebuild"
mv -f "$APP/Contents/MacOS/${PRODUCT_NAME}" "$APP/Contents/MacOS/${AG_HIDE_EXEC_PREFIX}${PRODUCT_NAME}" || exit 1

DST_DIR="${BUILT_PRODUCTS_DIR}"
if [[ ${ACTION} == "install" ]]; then
  DST_DIR="${INSTALL_ROOT}/Applications/"
  mkdir -p "${DST_DIR}"
fi

rm -Rfv "${DST_DIR}/${APP_NAME}"
cp -HRfp "${APP}" "${DST_DIR}"

# Get rid of redundant asar files (need only one app.asar):
# for the moment app.asar is path resolver for app-x64.asar and app-arm64.asar, that we don't need
rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"
# we had run electron-packager for both architectures so asar files for x64 and arm64 are similar
# and we can remove one of them and rename other one to app.asar
rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app-x64.asar"
mv "${DST_DIR}/${APP_NAME}/Contents/Resources/app-arm64.asar" "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"

cd ../AdGuard
