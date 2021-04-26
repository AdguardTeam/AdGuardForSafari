#!/bin/bash

mkdir -p $TARGET_TEMP_DIR/arm64
mkdir -p $TARGET_TEMP_DIR/x86_64

echo "Build electron app for arm64"
bash ../Scripts/build-electron-app-one-arch.sh arm64 "$TARGET_TEMP_DIR/arm64"

echo "Build electron app for x86_64"
bash ../Scripts/build-electron-app-one-arch.sh x86_64 "$TARGET_TEMP_DIR/x86_64"

echo "Create universal build"
cd ../ElectronMainApp
yarn make-universal-app "$TARGET_TEMP_DIR"

DST_DIR="${BUILT_PRODUCTS_DIR}"
if [[ ${ACTION} == "install" ]]; then
  DST_DIR="${INSTALL_ROOT}/Applications/"
  mkdir -p "${DST_DIR}"
fi

APP_NAME="AdGuard for Safari.app"
rm -Rfv "${DST_DIR}/${APP_NAME}"
cp -HRfp "${TARGET_TEMP_DIR}/${APP_NAME}" "${DST_DIR}"

rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"
rm "${DST_DIR}/${APP_NAME}/Contents/Resources/app-arm64.asar"

mv "${DST_DIR}/${APP_NAME}/Contents/Resources/app-x64.asar" "${DST_DIR}/${APP_NAME}/Contents/Resources/app.asar"

cd ../AdGuard
